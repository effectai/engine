// composables/useSignAndSendTransaction.ts
import { computed, toRaw } from "vue";
import type { UiWalletAccount } from "@wallet-standard/ui";
import { getWalletAccountFeature } from "@wallet-standard/ui";
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from "@wallet-standard/ui-registry";

import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignAndSendTransactionInput,
  type SolanaSignAndSendTransactionOutput,
} from "@solana/wallet-standard-features";

import {
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WalletStandardError,
} from "@wallet-standard/errors";

// If you want the stricter chain type:
export type OnlySolanaChains<TChains extends readonly string[]> = Extract<
  TChains[number],
  `solana:${string}`
>;

type Input = Readonly<
  Omit<SolanaSignAndSendTransactionInput, "account" | "chain" | "options"> & {
    options?: Readonly<{ minContextSlot?: bigint }>;
  }
>;
type Output = SolanaSignAndSendTransactionOutput;

/**
 * Returns a function that signs & sends a single serialized transaction.
 * Vue equivalent of the React hook.
 */
export function useSignAndSendTransaction<
  TWalletAccount extends UiWalletAccount,
>(
  uiWalletAccount: TWalletAccount,
  chain: OnlySolanaChains<TWalletAccount["chains"]> | `solana:${string}`,
) {
  const signAndSendMany = useSignAndSendTransactions(uiWalletAccount, chain);

  // keep the same call signature
  const signAndSendOne = async (input: Input): Promise<Output> => {
    const [result] = await signAndSendMany(input);
    return result;
  };

  return signAndSendOne;
}

/**
 * Returns a function that signs & sends one or more serialized transactions.
 */
export function useSignAndSendTransactions<
  TWalletAccount extends UiWalletAccount,
>(uiWalletAccount: TWalletAccount, chain: `solana:${string}`) {
  // Validate chain support (same behavior as your React version)
  if (!uiWalletAccount.chains.includes(chain)) {
    throw new WalletStandardError(
      WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
      {
        address: uiWalletAccount.address,
        chain,
        featureName: SolanaSignAndSendTransaction,
        supportedChains: [...uiWalletAccount.chains],
        supportedFeatures: [...uiWalletAccount.features],
      },
    );
  }

  const signAndSendTransactionFeature = getWalletAccountFeature(
    uiWalletAccount,
    SolanaSignAndSendTransaction,
  ) as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

  // Yes, this is the same internal helper used in the React sample.
  const account =
    getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
      uiWalletAccount,
    );

  // In Vue we don’t need a memoized callback—just return a stable function.
  const signAndSendMany = async (...inputs: readonly Input[]) => {
    // Ensure we’re not passing proxies to wallet libs
    const rawAccount = toRaw(account);

    const inputsWithChainAndAccount = inputs.map(({ options, ...rest }) => {
      const minContextSlot = options?.minContextSlot;
      return {
        ...rest,
        account: rawAccount,
        chain,
        ...(minContextSlot != null
          ? {
              options: {
                // Wallet-standard expects a number here; convert from bigint
                minContextSlot: Number(minContextSlot),
              },
            }
          : null),
      };
    });

    const results = await signAndSendTransactionFeature.signAndSendTransaction(
      ...inputsWithChainAndAccount,
    );

    return results as readonly Output[];
  };

  return signAndSendMany;
}
