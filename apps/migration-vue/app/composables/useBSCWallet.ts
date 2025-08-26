import { useQuery } from "@tanstack/vue-query";
import { useAccount, useConfig, useConnect, useDisconnect } from "@wagmi/vue";
import { toBytes } from "viem";
import { getBalance, signMessage } from "wagmi";
import type { SourceWallet, WalletConnectionMeta } from "~/types/types";

export const useBscWallet = (): SourceWallet => {
  const { address, isConnected, connector } = useAccount();
  const config = useConfig();

  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const walletMeta: Ref<WalletConnectionMeta | undefined | null> = computed(
    () =>
      connector.value && {
        name: connector.value.name,
        icon: connector.value.icon,
        chain: "BSC",
      },
  );

  const getEfxBalance = async () => {
    if (!address.value) {
      throw new Error("No address found");
    }

    const balance = await getBalance(config, {
      address: address.value,
      token: "0xC51Ef828319b131B595b7ec4B28210eCf4d05aD0",
    });

    return {
      symbol: "EFX",
      value: Number(balance.formatted),
    };
  };

  const getNativeBalance = async () => {
    if (!address.value) {
      throw new Error("No address found");
    }

    return {
      symbol: "BNB",
      value: Number(balance.formatted),
    };
  };

  const authorizeTokenClaim = async (
    destinationAddress: string,
  ): Promise<{
    foreignPublicKey: Uint8Array;
    signature: Uint8Array;
    message: Uint8Array;
  }> => {
    if (!address.value) {
      throw new Error("No public key");
    }

    const originalMessage = `Effect.AI: I authorize my tokens to be claimed at the following Solana address:${destinationAddress}`;
    const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
    const message = Buffer.from(prefix + originalMessage);
    const signature = await signMessage(config, { message: originalMessage });

    if (!address.value) {
      throw new Error("No address found");
    }

    return {
      foreignPublicKey: toBytes(address.value),
      signature: toBytes(signature),
      message,
    };
  };

  const getForeignPublicKey = async () => {
    if (!address.value) {
      throw new Error("No address found");
    }
    return toBytes(address.value);
  };

  return {
    address,
    isConnected,
    walletMeta,

    getEfxBalance,
    getNativeBalance,

    authorizeTokenClaim,
    getForeignPublicKey,

    connect,
    disconnect,
  };
};
