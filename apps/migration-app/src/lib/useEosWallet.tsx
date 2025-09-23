"use client";

import {
  ABICache,
  Action,
  PlaceholderAuth,
  PublicKey,
  type Session,
  SessionKit,
  Signature,
  Transaction,
  TransactionHeader,
} from "@wharfkit/session";
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor";
import { WalletPluginTokenPocket } from "@wharfkit/wallet-plugin-tokenpocket";
import { WalletPluginWombat } from "@wharfkit/wallet-plugin-wombat";
import { WebRenderer } from "@wharfkit/web-renderer";
import { useCallback, useMemo, useState } from "react";
import type { SourceWallet, WalletConnectionMeta } from "./wallet-types";

export function extractEosPublicKeyBytes(eosPubkey: string): Uint8Array | null {
  const publicKey = PublicKey.from(eosPubkey);
  return publicKey.data.array.slice(1, 33);
}

type EosWalletState = {
  session: Session | null;
  address?: string;
  walletMeta?: WalletConnectionMeta | null;
  isConnected: boolean;
};

export function useEosWallet(): SourceWallet & EosWalletState {
  const [session, setSession] = useState<Session | null>(null);

  // Keep SessionKit stable across renders
  const sessionKit = useMemo(() => {
    return new SessionKit({
      appName: "Effect Migration Portal",
      chains: [
        {
          id: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
          url: "https://eos.greymass.com",
        },
      ],
      ui: new WebRenderer(),
      walletPlugins: [
        new WalletPluginAnchor(),
        new WalletPluginWombat(),
        new WalletPluginTokenPocket(),
      ],
    });
  }, []);

  const address = session?.actor?.toString();

  const walletMeta: WalletConnectionMeta | null = session
    ? {
        name: session.walletPlugin.metadata.name || "Unknown EOS Wallet",
        icon: session.walletPlugin.metadata.logo?.light,
        permission: session.permission.toString(),
        chain: "EOS",
      }
    : null;

  const isConnected = !!session && !!address;

  const connect = useCallback(async () => {
    const result = await sessionKit.login();
    console.log("EOS login result:", result);
    setSession(result.session);
  }, [sessionKit]);

  const disconnect = useCallback(async () => {
    setSession(null);
    await sessionKit.logout();
  }, [sessionKit]);

  const getNativeBalance = useCallback(async () => {
    if (!session?.client) throw new Error("No client found");
    const res = await session.client.v1.chain.get_currency_balance(
      "eosio.token",
      session.actor,
      "EOS",
    );
    return { value: res[0]?.value ?? 0, symbol: "EOS" };
  }, [session]);

  const getEfxBalance = useCallback(async () => {
    if (!session?.client) throw new Error("No client found");
    const res = await session.client.v1.chain.get_currency_balance(
      "effecttokens",
      session.actor,
      "EFX",
    );
    return { value: res[0]?.value ?? 0, symbol: "EFX" };
  }, [session]);

  const getForeignPublicKey = useCallback(async () => {
    if (!session?.client) throw new Error("No client found");
    const res = await session.client.v1.chain.get_account(session.actor);
    const perm = res.getPermission(session.permission.toString());
    const publicKey = perm.required_auth.keys[0].key.toString();
    const compressed = extractEosPublicKeyBytes(publicKey);
    if (!compressed) throw new Error("Could not compress public key");
    return compressed;
  }, [session]);

  const authorizeTokenClaim = useCallback(
    async (destinationAddress: string) => {
      if (!session?.client) throw new Error("No client found");

      const originalMessage = `Effect.AI: I authorize my tokens to be claimed at the following Solana address:${destinationAddress}`;

      const res = await session.client.v1.chain.get_account(session.actor);
      const perm = res.getPermission(session.permission.toString());
      const publicKeyStr = perm.required_auth.keys[0].key.toString();
      const foreignPublicKey = extractEosPublicKeyBytes(publicKeyStr);
      if (!foreignPublicKey) throw new Error("Could not compress public key");

      const abi = new ABICache(session.client);
      const eosAbi = await abi.getAbi("effecttokens");

      const action = Action.from(
        {
          account: "effecttokens",
          name: "issue",
          authorization: [PlaceholderAuth],
          data: {
            to: "effectai",
            quantity: "0 EFX",
            memo: originalMessage,
          },
        },
        eosAbi,
      );

      const txHeader = TransactionHeader.from({
        expiration: 0,
        ref_block_num: 0,
        ref_block_prefix: 0,
        delay_sec: 0,
      });

      const tx = Transaction.from({ actions: [action], ...txHeader });
      const result = await session.transact(tx, { broadcast: false });
      const signingData = result.resolved?.signingData;
      if (!signingData) throw new Error("Could not serialize transaction");

      let goodSig: Signature | null = null;
      for (const s of result.signatures) {
        const sig = Signature.from(s);
        if (sig.verifyMessage(signingData, PublicKey.from(publicKeyStr))) {
          goodSig = sig;
          break;
        }
      }
      if (!goodSig) throw new Error("Could not verify signature");

      return {
        signature: goodSig.data.array,
        message: signingData.array,
        foreignPublicKey,
      };
    },
    [session],
  );

  return {
    // state
    session,
    address,
    walletMeta,
    isConnected,
    // API
    connect,
    disconnect,
    getNativeBalance,
    getEfxBalance,
    getForeignPublicKey,
    authorizeTokenClaim,
  };
}
