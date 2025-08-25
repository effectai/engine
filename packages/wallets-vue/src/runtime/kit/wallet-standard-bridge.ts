import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignAndSendTransactionOutput,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
  type SolanaSignTransactionOutput,
} from "@solana/wallet-standard-features";
import type {
  Address,
  SignatureBytes,
  Transaction,
  TransactionModifyingSigner,
  TransactionSendingSigner,
  TransactionSigner,
} from "@solana/kit";
import { getTransactionCodec } from "@solana/kit";
import {
  WalletError,
  WalletSendTransactionError,
} from "@solana/wallet-adapter-base";

export type SignAndSendInputOptions = {
  skipPreflight?: boolean;
  preflightCommitment?: "processed" | "confirmed" | "finalized";
  maxRetries?: number;
  minContextSlot?: number;
};

export type ModifyAndSignFn = (input: {
  transaction: Uint8Array;
  options?: SignAndSendInputOptions;
}) => Promise<SolanaSignTransactionOutput>;

export function makeModifyAndSign(
  wallet: Wallet,
  account: WalletAccount,
  chain: `solana:${string}`,
): ModifyAndSignFn {
  if (!account.chains?.includes(chain)) {
    throw new Error(`Account does not support chain ${chain}`);
  }

  const feature = wallet.features[SolanaSignTransaction] as
    | SolanaSignTransactionFeature[typeof SolanaSignTransaction]
    | undefined;

  if (!feature) {
    throw new Error("Wallet lacks SolanaSignAndSendTransaction feature");
  }

  return async ({ transaction, options }) => {
    const [signature] = await feature.signTransaction({
      transaction,
      account,
      chain,
      options: {
        // skipPreflight: true,
        ...options,
      },
    });

    return signature;
  };
}

export type SignAndSendFn = (input: {
  transaction: Uint8Array;
  options?: SignAndSendInputOptions;
}) => Promise<SolanaSignAndSendTransactionOutput>;

export function makeSignAndSend(
  wallet: Wallet,
  account: WalletAccount,
  chain: `solana:${string}`,
  defaults: SignAndSendInputOptions = { skipPreflight: true },
): SignAndSendFn {
  if (!account.chains?.includes(chain)) {
    throw new Error(`Account does not support chain ${chain}`);
  }

  const feature = wallet.features[SolanaSignAndSendTransaction] as
    | SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]
    | undefined;

  if (!feature) {
    throw new Error("Wallet lacks SolanaSignAndSendTransaction feature");
  }

  return async ({ transaction, options }) => {
    const merged = { ...defaults, ...(options || {}) };
    try {
      const [out] = await feature.signAndSendTransaction({
        transaction,
        account,
        chain,
        options: merged,
      });

      return out;
    } catch (error: any) {
      if (error instanceof WalletError) throw error;
      console.log(error.code);
      throw new WalletSendTransactionError(error?.message, error);
    }
  };
}

export function createTransactionSendingSigner({
  address,
  signAndSend,
  modifyAndSign,
  defaultOptions,
  onEachSignature,
}: {
  address: Address;
  signAndSend: SignAndSendFn;
  modifyAndSign: ModifyAndSignFn;
  defaultOptions?: SignAndSendInputOptions;
  onEachSignature?: (sig: SignatureBytes) => void | Promise<void>;
}) {
  const codec = getTransactionCodec();

  const signer: TransactionSendingSigner & TransactionModifyingSigner = {
    address,
    async modifyAndSignTransactions(transactions, config) {
      if (transactions.length > 1) {
        throw new Error(
          "[solana-wallet-vue] modifyAndSignTransactions only supports one transaction at a time",
        );
      }

      const [transaction] = transactions;
      const wireBytes = codec.encode(transaction);

      const signedTx = await modifyAndSign({
        transaction: wireBytes,
        options: defaultOptions,
      });
      const decodedSignedTransaction = getTransactionCodec().decode(
        signedTx.signedTransaction,
      );

      return Object.freeze([decodedSignedTransaction]);
    },
    signAndSendTransactions: async (
      transactions: Transaction[],
    ): Promise<SignatureBytes[]> => {
      if (transactions.length > 1) {
        throw new Error(
          "[solana-wallet-vue] signAndSendTransactions only supports one transaction at a time",
        );
      }

      const [transaction] = transactions;
      const wireBytes = codec.encode(transaction);

      const signature = await signAndSend({
        transaction: wireBytes,
        options: defaultOptions,
      });

      return Object.freeze([signature.signature]);
    },
  };
  return signer;
}
