import type { Wallet, WalletAccount } from "@wallet-standard/base";

import {
  type TransactionSendingSigner,
  type Address,
  type SignatureBytes,
  type Transaction,
  getTransactionCodec,
} from "@solana/kit";

import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignAndSendTransactionOutput,
} from "@solana/wallet-standard-features";

type Input = Readonly<
  Omit<
    Parameters<
      SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]["signAndSendTransaction"]
    >[0],
    "account" | "chain" | "options"
  > & {
    transaction: Uint8Array;
    options?: Readonly<{ minContextSlot?: bigint }>;
  }
>;

export function makeSignAndSend(
  wallet: Wallet,
  account: WalletAccount,
  chain: `solana:${string}`,
) {
  if (!account.chains?.includes(chain)) {
    throw new Error(`Account does not support chain ${chain}`);
  }

  const feature = wallet.features[SolanaSignAndSendTransaction] as
    | SolanaSignAndSendTransactionFeature["solana:signAndSendTransaction"]
    | undefined;

  if (!feature)
    throw new Error("Wallet lacks SolanaSignAndSendTransaction feature");

  return async (input: Input): Promise<SolanaSignAndSendTransactionOutput> => {
    const { options, ...rest } = input;

    const minContextSlot = options?.minContextSlot;

    const [out] = await feature.signAndSendTransaction({
      ...rest,
      account,
      chain,
      options: { skipPreflight: true },
      ...(minContextSlot != null
        ? {
            options: {
              minContextSlot: Number(minContextSlot),
            },
          }
        : null),
    });

    return out;
  };
}

export const createTransactionSendingSigner = ({
  address,
  signAndSend,
}: {
  address: Address;
  signAndSend: (transaction: Transaction) => Promise<SignatureBytes[]>;
}): TransactionSendingSigner => {
  const signer: TransactionSendingSigner = {
    address,
    signAndSendTransactions: async (
      transactions: Transaction[],
    ): Promise<SignatureBytes[]> => {
      const [transaction] = transactions;
      const wireTransactionBytes = getTransactionCodec().encode(transaction);

      const inputWithOptions = {
        transaction: wireTransactionBytes,
      };

      const signature = await signAndSend(inputWithOptions);
      console.log("Transaction signed and sent, signature:", signature);
      return Object.freeze([signature.signature]);
    },
  };

  return signer;
};
