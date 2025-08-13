import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/vue-query";
import { useWallet } from "solana-wallets-vue";
import type { TargetWalletAdapter, WalletConnectionMeta } from "~/types/types";

export const useSolanaWallet = (): TargetWalletAdapter => {
  const { connection } = useConnection();
  const { connect, disconnect, wallet, publicKey } = useWallet();

  const address = computed(() => publicKey.value?.toBase58());

  const walletMeta: Ref<WalletConnectionMeta | undefined | null> = computed(
    () =>
      wallet.value && {
        name: wallet.value.adapter.name,
        icon: wallet.value.adapter.icon,
      },
  );

  const isConnected = computed(() => publicKey.value !== null);

  const useGetBalanceQuery = (account: Ref<PublicKey | string | null>) => {
    const accountToUse = computed(() => {
      if (typeof account.value === "string") {
        return new PublicKey(account.value);
      }
      return account.value;
    });

    return useQuery({
      queryKey: ["solana-balance", accountToUse],
      enabled: computed(() => !!accountToUse !== null),
      refetchInterval: 15_000,
      queryFn: async () => {
        if (!accountToUse.value) {
          throw new Error("No public key");
        }

        const data = await connection.getBalance(accountToUse.value);

        return {
          value: data / 10 ** 9,
          symbol: "SOL",
        };
      },
    });
  };

  const useGetEfxBalanceQuery = () => {
    const { mint } = useEffectConfig();
    const { publicKey } = useWallet();

    return useQuery({
      queryKey: ["efx-balance", publicKey, "stake"],
      enabled: computed(() => !!publicKey.value !== null),
      queryFn: async () => {
        if (!publicKey.value) {
          throw new Error("No public key");
        }

        const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

        try {
          const balance = await connection.getTokenAccountBalance(ata);
          return {
            value: balance.value.uiAmount || 0,
            symbol: "EFFECT",
          };
        } catch (e) {
          return {
            value: 0,
            symbol: "EFFECT",
          };
        }
      },
    });
  };

  const useGetTokenAccountBalanceQuery = (
    account: Ref<PublicKey | undefined>,
  ) => {
    return useQuery({
      queryKey: ["token-account-balance", account, account.value?.toBase58()],
      enabled: computed(() => !!account.value !== null),
      queryFn: async () => {
        if (!publicKey.value) {
          throw new Error("No public key");
        }

        if (!account.value) {
          throw new Error("No account");
        }

        try {
          const balance = await connection.getTokenAccountBalance(
            account.value,
          );
          return {
            value: balance.value.uiAmount || 0,
            symbol: "EFFECT",
          };
        } catch (e) {
          return {
            value: 0,
            symbol: "EFFECT",
          };
        }
      },
    });
  };

  return {
    // state
    address,
    walletMeta,
    isConnected,

    // queries
    useGetBalanceQuery,

    useGetEfxBalanceQuery,
    useGetTokenAccountBalanceQuery,

    // methods
    connect,
    disconnect,
  };
};
