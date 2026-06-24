import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction, getAddress } from '@stellar/freighter-api';

const networkPassphrase = StellarSdk.Networks.TESTNET;

const horizonServer = new StellarSdk.Horizon.Server(
  'https://horizon-testnet.stellar.org'
);

const rpcServer = new StellarSdk.rpc.Server(
  'https://soroban-testnet.stellar.org'
);

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || 'CCEEH4GNU77DGMKSXMQAQJAVEZCIHHW4QBJZ2IBSQVV4ZAACOHS4ZB4M';
const POOL_TREASURY = import.meta.env.VITE_POOL_TREASURY_ADDRESS || 'GDGSHBO7VF2E6ZUB2DLGOBBRQUNNLL3V6M7JQEUUT6SEJOTEPAIGLMMX';

async function submitAndPoll(signedTx: StellarSdk.Transaction): Promise<string> {
  const response = await rpcServer.sendTransaction(signedTx);

  if (response.status === 'ERROR') {
    const errorResult = (response as any).errorResult;
    throw new Error(`Send transaction failed: ${JSON.stringify(errorResult)}`);
  }

  let status: string = response.status as string;
  const txHash = response.hash;

  for (let i = 0; i < 20; i++) {
    if (status === 'SUCCESS') return txHash;
    if (status === 'FAILED') throw new Error("Transaction execution failed on ledger.");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const txResponse = await rpcServer.getTransaction(txHash);
    status = txResponse.status as string;
  }

  throw new Error("Transaction timed out.");
}

async function submitClassicTx(signedXdr: string): Promise<string> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  try {
    const result = await horizonServer.submitTransaction(tx as StellarSdk.Transaction);
    if (!result.hash) throw new Error("No hash returned from classic tx");
    return result.hash;
  } catch (err: any) {
    const extras = err?.response?.data?.extras;
    const resultCodes = extras?.result_codes;
    const resultXdr = extras?.result_xdr;
    console.error("Full Horizon error:", JSON.stringify(err?.response?.data, null, 2));
    throw new Error(`Payment failed: ${JSON.stringify(resultCodes)} | XDR: ${resultXdr}`);
  }
}
/**
 * Step 1: Send XLM via classic payment to contract address
 * Step 2: Register escrow in contract storage
 */
export async function callCreateEscrow(
  walletAddress: string,
  receiverAddress: string,
  amount: string
): Promise<string> {
  try {
    // Confirm active Freighter address matches
    const addressResult = await getAddress();
    if (addressResult.error) throw new Error("Could not get Freighter address.");
    const activeWallet = addressResult.address;

    if (activeWallet !== walletAddress) {
      throw new Error(`Wallet mismatch. Connected: ${activeWallet}, Expected: ${walletAddress}. Please reconnect your wallet.`);
    }

    const parsedAmount = parseFloat(amount).toFixed(7);
    const parsedAmountStroops = Math.round(parseFloat(amount) * 10_000_000);

    const sourceAccount = await horizonServer.loadAccount(activeWallet);

    const paymentTx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: POOL_TREASURY,
          asset: StellarSdk.Asset.native(),
          amount: parsedAmount,
        })
      )
      .addMemo(StellarSdk.Memo.text('escrow-deposit'))
      .setTimeout(30)
      .build();

    const paymentSignResult = await signTransaction(
      paymentTx.toXDR(),
      { networkPassphrase: StellarSdk.Networks.TESTNET }
    );
    if (paymentSignResult.error) throw new Error(paymentSignResult.error);

    const signedPaymentTx = StellarSdk.TransactionBuilder.fromXDR(
      paymentSignResult.signedTxXdr,
      StellarSdk.Networks.TESTNET
    );

    try {
      const paymentResult = await horizonServer.submitTransaction(
        signedPaymentTx as StellarSdk.Transaction
      );
      if (!paymentResult.hash) throw new Error("Payment failed - no hash returned");
    } catch (err: any) {
      const resultCodes = err?.response?.data?.extras?.result_codes;
      throw new Error(`Payment failed: ${JSON.stringify(resultCodes)}`);
    }

    // STEP 2: Register escrow in Soroban contract
    const freshAccount = await horizonServer.loadAccount(activeWallet);
    const amountVal = StellarSdk.nativeToScVal(BigInt(parsedAmountStroops), { type: 'i128' });

    const args = [
      StellarSdk.Address.fromString(activeWallet).toScVal(),
      StellarSdk.Address.fromString(receiverAddress).toScVal(),
      amountVal,
    ];

    const escrowTx = new StellarSdk.TransactionBuilder(freshAccount, {
      fee: String(100 * parseInt(StellarSdk.BASE_FEE)),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: 'create_escrow',
          args,
        })
      )
      .setTimeout(60)
      .build();

    const simResult = await rpcServer.simulateTransaction(escrowTx);
    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = await rpcServer.prepareTransaction(escrowTx);

    const signResult = await signTransaction(
      preparedTx.toXDR(),
      { networkPassphrase: StellarSdk.Networks.TESTNET }
    );
    if (signResult.error) throw new Error(signResult.error);

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signResult.signedTxXdr,
      StellarSdk.Networks.TESTNET
    ) as StellarSdk.Transaction;

    return await submitAndPoll(signedTx);

  } catch (err: any) {
    console.error("callCreateEscrow error:", err);
    throw new Error(err.message || "Failed to create escrow.");
  }
}
export async function callReleaseFunds(
  escrowId: string,
  walletAddress?: string
): Promise<string> {
  try {
    const activeAddress = walletAddress || localStorage.getItem('trustlend_wallet');
    if (!activeAddress) throw new Error("No active wallet connection found.");

    const sourceAccount = await horizonServer.loadAccount(activeAddress);
    const args = [StellarSdk.nativeToScVal(BigInt(escrowId), { type: 'u64' })];

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: String(100 * parseInt(StellarSdk.BASE_FEE)),
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: 'release_funds',
          args,
        })
      )
      .setTimeout(60)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = await rpcServer.prepareTransaction(tx);
    const xdr = preparedTx.toXDR();

    const signResult = await signTransaction(xdr, {
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });
    if (signResult.error) throw new Error(signResult.error);

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signResult.signedTxXdr,
      networkPassphrase
    ) as StellarSdk.Transaction;

    return await submitAndPoll(signedTx);
  } catch (error: any) {
    console.error("callReleaseFunds error:", error);
    throw new Error(error.message || "Failed to release funds.");
  }
}

export async function callRefundFunds(
  escrowId: string,
  walletAddress?: string
): Promise<string> {
  try {
    const activeAddress = walletAddress || localStorage.getItem('trustlend_wallet');
    if (!activeAddress) throw new Error("No active wallet connection found.");

    const sourceAccount = await horizonServer.loadAccount(activeAddress);
    const args = [StellarSdk.nativeToScVal(BigInt(escrowId), { type: 'u64' })];

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: String(100 * parseInt(StellarSdk.BASE_FEE)),
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: 'refund_funds',
          args,
        })
      )
      .setTimeout(60)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = await rpcServer.prepareTransaction(tx);
    const xdr = preparedTx.toXDR();

    const signResult = await signTransaction(xdr, {
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });
    if (signResult.error) throw new Error(signResult.error);

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signResult.signedTxXdr,
      networkPassphrase
    ) as StellarSdk.Transaction;

    return await submitAndPoll(signedTx);
  } catch (error: any) {
    console.error("callRefundFunds error:", error);
    throw new Error(error.message || "Failed to refund funds.");
  }
}