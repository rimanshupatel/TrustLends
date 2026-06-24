import * as StellarSdk from '@stellar/stellar-sdk';
import * as freighter from '@stellar/freighter-api';

// Initializing the Stellar Horizon Server on Testnet
export const server = new StellarSdk.Horizon.Server(
  'https://horizon-testnet.stellar.org'
);
export const networkPassphrase = StellarSdk.Networks.TESTNET;

/**
 * Checks if the Freighter extension is installed and active.
 */

import { requestAccess, getAddress, getNetwork, signTransaction } from '@stellar/freighter-api';

export const checkFreighterInstalled = async (): Promise<boolean> => {
  try {
    const result = await getAddress();
    return !result.error;
  } catch {
    return false;
  }
};

export const getConnectedWalletAddress = async (): Promise<string> => {
  try {
    const result = await requestAccess();
    if (result.error) throw new Error(result.error.message);
    return result.address;
  } catch (err: any) {
    throw new Error(err.message || "Failed to retrieve address from Freighter");
  }
};

export const checkNetworkIsTestnet = async (): Promise<boolean> => {
  try {
    const result = await getNetwork();
    if (result.error) return false;
    return result.network === 'TESTNET';
  } catch {
    return false;
  }
};
/**
 * Fetches native XLM balance from Horizon testnet.
 * If account does not exist (not funded), it returns '0' and throws an error indicating account is not funded.
 */
export const fetchXLMBalance = async (address: string): Promise<string> => {
  try {
    const account = await server.loadAccount(address);
    const xlmBalance = account.balances.find(
      b => b.asset_type === 'native'
    );
    return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(4) : '0.0000';
  } catch (error: any) {
    // 404 means the account is not yet funded on testnet
    if (error.response?.status === 404 || error.status === 404) {
      throw new Error("UNFUNDED_ACCOUNT");
    }
    throw new Error("Unable to fetch balance. Retrying...");
  }
};

/**
 * Build, sign, and submit a payment transaction using Stellar SDK and Freighter wallet.
 */
export const sendXLMPayment = async (
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  memo?: string
): Promise<string> => {
  try {
    // 1. Load source account
    const sourceAccount = await server.loadAccount(sourceAddress);

    // 2. Build the payment transaction
    const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationAddress,
          asset: StellarSdk.Asset.native(),
          amount,
        })
      );

    if (memo && memo.trim() !== '') {
      transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
    } else {
      transactionBuilder.addMemo(StellarSdk.Memo.none());
    }

    const transaction = transactionBuilder.setTimeout(60).build();
    const xdr = transaction.toXDR();

    // 3. Request Freighter signature
    const signResult = await signTransaction(xdr, {
      networkPassphrase,
    });

    if (signResult.error) {
      throw new Error(signResult.error);
    }

    const signedXdr = signResult.signedTxXdr;

    // 4. Submit transaction to Horizon testnet
    const submittedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const result = await server.submitTransaction(submittedTx);

    if (!result.hash) {
      throw new Error("Transaction hash was not returned");
    }

    return result.hash;
  } catch (error: any) {
    console.error("Payment transaction error:", error);

    // Friendly error messaging
    const rawErrorString = error.toString().toLowerCase();
    if (rawErrorString.includes("user declined") || rawErrorString.includes("user rejected")) {
      throw new Error("Transaction cancelled by user.");
    } else if (rawErrorString.includes("unfunded")) {
      throw new Error("Recipient account does not exist. Must be funded first.");
    } else if (rawErrorString.includes("op_underfunded") || rawErrorString.includes("insufficient")) {
      throw new Error("Not enough XLM to complete this transaction.");
    } else if (rawErrorString.includes("op_no_destination")) {
      throw new Error("Destination account does not exist.");
    } else {
      throw new Error(error.message || "Failed to process transaction on Stellar Network.");
    }
  }
};
