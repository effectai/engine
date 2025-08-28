"use client";

import { useMemo, useCallback } from "react";
import type { SourceWallet, WalletConnectionMeta } from "./wallet-types";
import { useAccount, useConnect, useDisconnect, useConfig } from "wagmi";
import { useBalance, useSignMessage } from "wagmi";
import { toBytes } from "viem";
import { useAppKit } from "@reown/appkit/react";

const EFX_TOKEN = "0xC51Ef828319b131B595b7ec4B28210eCf4d05aD0" as const;

export function useBscWallet(): SourceWallet {
  const { address, isConnected, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const config = useConfig();
  const { open } = useAppKit();

  const walletMeta = useMemo<WalletConnectionMeta | null>(() => {
    if (!connector) return null;
    return {
      name: connector.name,
      // some injected connectors expose an icon; if not, leave undefined
      icon: (connector as any).icon,
      chain: "BSC",
      // you can add permission/info if you track it
      permission: "eoa",
    };
  }, [connector]);

  const getEfxBalance = useCallback(async () => {
    if (!address) throw new Error("No address found");
    const bal = await getBalance(config, { address, token: EFX_TOKEN });
    return { symbol: "EFX", value: Number(bal.formatted) };
  }, [address, config]);

  const getNativeBalance = useCallback(async () => {
    if (!address) throw new Error("No address found");
    const bal = await getBalance(config, { address }); // native BNB
    return { symbol: "BNB", value: Number(bal.formatted) };
  }, [address, config]);

  const authorizeTokenClaim = useCallback(
    async (destinationAddress: string) => {
      if (!address) throw new Error("No public key/address");

      const originalMessage =
        `Effect.AI: I authorize my tokens to be claimed at the following Solana address:` +
        destinationAddress;

      const signature = await signMessageAsync({
        message: originalMessage,
      });

      const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
      const messageBytes = new TextEncoder().encode(prefix + originalMessage);

      return {
        foreignPublicKey: toBytes(address),
        signature: toBytes(signature),
        message: messageBytes,
      };
    },
    [address, config],
  );

  const getForeignPublicKey = useCallback(async () => {
    if (!address) throw new Error("No address found");
    return toBytes(address);
  }, [address]);

  return {
    address,
    isConnected,
    walletMeta,

    getEfxBalance,
    getNativeBalance,

    authorizeTokenClaim,
    getForeignPublicKey,

    connect: async () => {
      open(); // open appkit modal for wallet selection
    },
    disconnect: async () => {
      disconnect();
    },
  };
}
