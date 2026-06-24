import * as StellarSdk from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const horizonUrl = 'https://horizon-testnet.stellar.org';
const server = new StellarSdk.Horizon.Server(horizonUrl);
const networkPassphrase = StellarSdk.Networks.TESTNET;

export const sendXLMPayment = async (
  destinationAddress: string,
  amount: string,
  memo?: string
): Promise<string> => {
  const secretKey = process.env.POOL_TREASURY_SECRET;
  if (!secretKey) {
    throw new Error('POOL_TREASURY_SECRET is not configured in the server environment (.env).');
  }

  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const sourceAddress = keypair.publicKey();

  // Load account
  const sourceAccount = await server.loadAccount(sourceAddress);

  // Build the payment transaction
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationAddress,
        asset: StellarSdk.Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(60);

  if (memo) {
    tx.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));
  }

  const builtTx = tx.build();
  builtTx.sign(keypair);

  const response = await server.submitTransaction(builtTx);
  if (!response.hash) {
    throw new Error('Disbursement transaction failed - no hash returned from Horizon.');
  }

  return response.hash;
};
