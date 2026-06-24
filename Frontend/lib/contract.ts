import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction, getAddress } from '@stellar/freighter-api';

const networkPassphrase = StellarSdk.Networks.TESTNET;

const horizonServer = new StellarSdk.Horizon.Server(
  'https://horizon-testnet.stellar.org'
);

const rpcServer = new StellarSdk.rpc.Server(
  'https://soroban-testnet.stellar.org'
);

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || 'CCM5NDCXGRACZBPKRXAPEOAJV4AO4ILAUN52TJBS7WTI4UL4RKWKUGKI';
const POOL_TREASURY = import.meta.env.VITE_POOL_TREASURY_ADDRESS || 'GDRNUHQGNSDT3FW6BLA7FRL4SXRSOUB2PV6HGPVSMML7FPLOECYWLDOA';

// ===== HELPERS =====
async function submitAndPoll(signedTx: StellarSdk.Transaction): Promise<string> {
  const response = await rpcServer.sendTransaction(signedTx);

  if (response.status === 'ERROR') {
    const errorResult = (response as any).errorResult;
    const resultCode = errorResult?._switch?.name || 'unknown';
    if (resultCode === 'txBadAuth') {
      throw new Error("Authorization failed. Make sure your Freighter wallet is connected.");
    }
    throw new Error(`Transaction failed: ${JSON.stringify(errorResult)}`);
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
    if (!result.hash) throw new Error("No hash returned");
    return result.hash;
  } catch (err: any) {
    const resultCodes = err?.response?.data?.extras?.result_codes;
    throw new Error(`Payment failed: ${JSON.stringify(resultCodes)}`);
  }
}

async function buildSignAndSubmit(
  walletAddress: string,
  contractFunction: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<string> {
  const sourceAccount = await horizonServer.loadAccount(walletAddress);

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: String(100 * parseInt(StellarSdk.BASE_FEE)),
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: contractFunction,
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
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });

  if (signResult.error) throw new Error(signResult.error);

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    networkPassphrase
  ) as StellarSdk.Transaction;

  return await submitAndPoll(signedTx);
}

// ===== LENDER FUNCTIONS =====

export async function callCreateEscrow(
  walletAddress: string,
  receiverAddress: string,
  amount: string
): Promise<string> {
  try {
    const addressResult = await getAddress();
    if (addressResult.error) throw new Error("Could not get Freighter address.");
    const activeWallet = addressResult.address;

    if (activeWallet !== walletAddress) {
      throw new Error(`Wallet mismatch. Please reconnect your wallet.`);
    }

    const parsedAmount = parseFloat(amount).toFixed(7);
    const parsedAmountStroops = Math.round(parseFloat(amount) * 10_000_000);

    // Step 1: Classic XLM payment to pool treasury
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
    await submitClassicTx(paymentSignResult.signedTxXdr);

    // Step 2: Register escrow in contract
    const amountVal = StellarSdk.nativeToScVal(BigInt(parsedAmountStroops), { type: 'i128' });
    const args = [
      StellarSdk.Address.fromString(activeWallet).toScVal(),
      StellarSdk.Address.fromString(receiverAddress).toScVal(),
      amountVal,
    ];

    return await buildSignAndSubmit(activeWallet, 'create_escrow', args);
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

    const args = [StellarSdk.nativeToScVal(BigInt(escrowId), { type: 'u64' })];
    return await buildSignAndSubmit(activeAddress, 'release_funds', args);
  } catch (err: any) {
    console.error("callReleaseFunds error:", err);
    throw new Error(err.message || "Failed to release funds.");
  }
}

export async function callRefundFunds(
  escrowId: string,
  walletAddress?: string
): Promise<string> {
  try {
    const activeAddress = walletAddress || localStorage.getItem('trustlend_wallet');
    if (!activeAddress) throw new Error("No active wallet connection found.");

    const args = [StellarSdk.nativeToScVal(BigInt(escrowId), { type: 'u64' })];
    return await buildSignAndSubmit(activeAddress, 'refund_funds', args);
  } catch (err: any) {
    console.error("callRefundFunds error:", err);
    throw new Error(err.message || "Failed to refund funds.");
  }
}

// ===== BORROWER FUNCTIONS =====

export async function callRequestLoan(
  walletAddress: string,
  amount: string,
  duration: number,
  trustScore: number,
  escrowId: string
): Promise<string> {
  try {
    const parsedAmountStroops = Math.round(parseFloat(amount) * 10_000_000);
    const args = [
      StellarSdk.Address.fromString(walletAddress).toScVal(),
      StellarSdk.nativeToScVal(BigInt(parsedAmountStroops), { type: 'i128' }),
      StellarSdk.nativeToScVal(duration, { type: 'u32' }),
      StellarSdk.nativeToScVal(trustScore, { type: 'u32' }),
      StellarSdk.nativeToScVal(BigInt(escrowId), { type: 'u64' }),
    ];

    return await buildSignAndSubmit(walletAddress, 'request_loan', args);
  } catch (err: any) {
    console.error("callRequestLoan error:", err);
    throw new Error(err.message || "Failed to request loan.");
  }
}

export async function callAutoRelease(
  loanId: string,
  adminWallet: string,
  trustScoreThreshold: number
): Promise<string> {
  try {
    const args = [
      StellarSdk.nativeToScVal(BigInt(loanId), { type: 'u64' }),
      StellarSdk.Address.fromString(adminWallet).toScVal(),
      StellarSdk.nativeToScVal(trustScoreThreshold, { type: 'u32' }),
    ];

    return await buildSignAndSubmit(adminWallet, 'auto_release', args);
  } catch (err: any) {
    console.error("callAutoRelease error:", err);
    throw new Error(err.message || "Failed to auto release.");
  }
}

export async function callRepayLoan(
  walletAddress: string,
  loanId: string,
  amount: string
): Promise<string> {
  try {
    const parsedAmountStroops = Math.round(parseFloat(amount) * 10_000_000);

    // Fix: MongoDB _id se sirf number extract karo ya default 1 use karo
    const loanIdNum = /^\d+$/.test(loanId) ? parseInt(loanId) : 1;

    const args = [
      StellarSdk.nativeToScVal(BigInt(loanIdNum), { type: 'u64' }),
      StellarSdk.Address.fromString(walletAddress).toScVal(),
      StellarSdk.nativeToScVal(BigInt(parsedAmountStroops), { type: 'i128' }),
    ];

    return await buildSignAndSubmit(walletAddress, 'repay_loan', args);
  } catch (err: any) {
    console.error("callRepayLoan error:", err);
    throw new Error(err.message || "Failed to repay loan.");
  }
}

export async function callMarkDefault(
  loanId: string,
  adminWallet: string
): Promise<string> {
  try {
    const args = [
      StellarSdk.nativeToScVal(BigInt(loanId), { type: 'u64' }),
      StellarSdk.Address.fromString(adminWallet).toScVal(),
    ];

    return await buildSignAndSubmit(adminWallet, 'mark_default', args);
  } catch (err: any) {
    console.error("callMarkDefault error:", err);
    throw new Error(err.message || "Failed to mark default.");
  }
}

// ===== GUARANTOR FUNCTIONS =====

export async function callLockGuarantee(
  guarantorWallet: string,
  borrowerWallet: string,
  amount: string
): Promise<string> {
  try {
    const parsedAmountStroops = Math.round(parseFloat(amount) * 10_000_000);
    const args = [
      StellarSdk.Address.fromString(guarantorWallet).toScVal(),
      StellarSdk.Address.fromString(borrowerWallet).toScVal(),
      StellarSdk.nativeToScVal(BigInt(parsedAmountStroops), { type: 'i128' }),
    ];

    return await buildSignAndSubmit(guarantorWallet, 'lock_guarantee', args);
  } catch (err: any) {
    console.error("callLockGuarantee error:", err);
    throw new Error(err.message || "Failed to lock guarantee.");
  }
}

export async function callReleaseGuarantee(
  guaranteeId: string,
  adminWallet: string
): Promise<string> {
  try {
    const args = [
      StellarSdk.nativeToScVal(BigInt(guaranteeId), { type: 'u64' }),
      StellarSdk.Address.fromString(adminWallet).toScVal(),
    ];

    return await buildSignAndSubmit(adminWallet, 'release_guarantee', args);
  } catch (err: any) {
    console.error("callReleaseGuarantee error:", err);
    throw new Error(err.message || "Failed to release guarantee.");
  }
}

export async function callSlashGuarantee(
  guaranteeId: string,
  adminWallet: string
): Promise<string> {
  try {
    const args = [
      StellarSdk.nativeToScVal(BigInt(guaranteeId), { type: 'u64' }),
      StellarSdk.Address.fromString(adminWallet).toScVal(),
    ];

    return await buildSignAndSubmit(adminWallet, 'slash_guarantee', args);
  } catch (err: any) {
    console.error("callSlashGuarantee error:", err);
    throw new Error(err.message || "Failed to slash guarantee.");
  }
}

// ===== READ FUNCTIONS =====

async function readContract(functionName: string, args: StellarSdk.xdr.ScVal[]) {
  try {
    const tx = new StellarSdk.TransactionBuilder(
      await horizonServer.loadAccount(POOL_TREASURY),
      { fee: StellarSdk.BASE_FEE, networkPassphrase }
    )
      .addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: functionName,
          args,
        })
      )
      .setTimeout(30)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Read failed: ${simResult.error}`);
    }

    return (simResult as any).result?.retval;
  } catch (err: any) {
    console.error(`readContract ${functionName} error:`, err);
    throw new Error(err.message || `Failed to read ${functionName}`);
  }
}

export async function callGetEscrow(escrowId: string) {
  const args = [StellarSdk.nativeToScVal(BigInt(escrowId), { type: 'u64' })];
  return await readContract('get_escrow', args);
}

export async function callGetLoan(loanId: string) {
  const args = [StellarSdk.nativeToScVal(BigInt(loanId), { type: 'u64' })];
  return await readContract('get_loan', args);
}

export async function callGetPoolBalance(): Promise<number> {
  try {
    const result = await readContract('get_pool_balance', []);
    const stroops = StellarSdk.scValToNative(result);
    return Number(stroops) / 10_000_000;
  } catch {
    return 0;
  }
}

export async function callGetWalletEscrows(walletAddress: string) {
  const args = [StellarSdk.Address.fromString(walletAddress).toScVal()];
  return await readContract('get_wallet_escrows', args);
}

export async function callGetWalletLoans(walletAddress: string) {
  const args = [StellarSdk.Address.fromString(walletAddress).toScVal()];
  return await readContract('get_wallet_loans', args);
}

export async function callGetWalletGuarantees(walletAddress: string) {
  const args = [StellarSdk.Address.fromString(walletAddress).toScVal()];
  return await readContract('get_wallet_guarantees', args);
}