"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { connect } from "solana-kite";
import type { SourceChain, SourceWallet, DestWallet } from "@/lib/wallet-types";
import { useEosWallet } from "@/lib/useEosWallet";
import { useBscWallet } from "@/lib/useBscWallet";
import { useSolanaWallet } from "@/lib/useSolanaWallet"; // your Solana hook
import { EFFECT } from "@/lib/useEffectConfig";
import {
  getClaimStakeInstructionAsync,
  getCreateStakeClaimInstructionAsync,
} from "@effectai/migration";
import {
  address,
  generateKeyPairSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  SolanaError,
  type Address,
  type TransactionSigner,
} from "@solana/kit";
import {
  fetchStakingAccountsByWalletAddress,
  getStakeInstructionAsync,
  EFFECT_STAKING_PROGRAM_ADDRESS,
} from "@effectai/stake";
import { useWalletAccountTransactionSigner } from "@solana/react";

type MigrationContextValue = {
  sourceChain: SourceChain;
  setSourceChain: (c: SourceChain) => void;

  source: SourceWallet; // EOS or BSC (selected)
  dest: DestWallet; // Solana

  ready: boolean; // both providers mounted
  canMigrate: boolean; // both wallets connected
};

const Ctx = createContext<MigrationContextValue | null>(null);
const STORAGE_KEY = "effect:selected-source-chain";

export function MigrationProvider({ children }: { children: React.ReactNode }) {
  const [sourceChain, setSourceChainState] = useState<SourceChain>("EOS");
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "EOS" || saved === "BSC") setSourceChainState(saved);
  }, []);
  const setSourceChain = (c: SourceChain) => {
    setSourceChainState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  // Instantiate all hooks unconditionally
  const eos = useEosWallet();
  const bsc = useBscWallet();
  const sol = useSolanaWallet();

  // Pick the active source wallet
  const source: SourceWallet = useMemo(() => {
    return sourceChain === "EOS" ? eos : bsc;
  }, [sourceChain, eos, bsc]);

  const dest: DestWallet = sol;

  const ready = true;
  const canMigrate = !!source.isConnected && !!dest.isConnected;

  const connection = connect(
    EFFECT.EFFECT_SOLANA_RPC_NODE_URL,
    EFFECT.EFFECT_SOLANA_RPC_WS_URL,
  );

  const claim = async ({
    signer,
    migrationAccount,
    foreignPublicKey,
    message,
    signature,
  }: {
    signer: TransactionSigner;
    migrationAccount: Address;
    foreignPublicKey: Uint8Array;
    message: Uint8Array;
    signature: Uint8Array;
  }) => {
    if (!source.isConnected) throw new Error("Source wallet not connected");
    if (!dest.isConnected || !dest.address)
      throw new Error("Destination wallet not connected");

    if (!sol.uiWalletEntry) {
      throw new Error("Solana wallet UI entry not found");
    }

    let stakeAccountToUse = null;
    //get stake accounts, if not, create one.
    const [stakeAccount] = await fetchStakingAccountsByWalletAddress({
      walletAddress: dest.address,
      rpc: connection.rpc,
    });

    console.log("stakeAccount", stakeAccount);

    const instructions = [];

    const userTokenAccount = await connection.getTokenAccountAddress(
      address(dest.address),
      address(EFFECT.EFFECT_SPL_MINT),
    );
    console.log("userTokenAccount", userTokenAccount);

    if (!stakeAccount) {
      const newStakeAccount = await generateKeyPairSigner();
      stakeAccountToUse = newStakeAccount.address;
      const stakeIx = await getStakeInstructionAsync({
        mint: address(EFFECT.EFFECT_SPL_MINT),
        amount: 0,
        userTokenAccount,
        duration: 30 * 24 * 60 * 60,
        stakeAccount: newStakeAccount,
        authority: signer,
      });
      instructions.push(stakeIx);
    } else {
      console.log("Using existing stake account", stakeAccount);
      stakeAccountToUse = stakeAccount.pubkey;
    }

    const [stakingVaultAddress] = await getProgramDerivedAddress({
      programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
      seeds: [getAddressEncoder().encode(stakeAccountToUse)],
    });

    const claimIx = await getClaimStakeInstructionAsync({
      mint: address(EFFECT.EFFECT_SPL_MINT),
      recipientTokenAccount: userTokenAccount,
      signature,
      stakeVaultTokenAccount: stakingVaultAddress,
      stakeAccount: stakeAccountToUse,
      message,
      authority: signer,
      migrationAccount,
    });

    try {
      const tx = await connection.sendTransactionFromInstructions({
        feePayer: signer,
        instructions: [...instructions, claimIx],
        maximumClientSideRetries: 3,
      });
      console.log("Transaction sent:", tx);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  const value = useMemo(
    () => ({
      config: EFFECT,
      connection,
      sourceChain,
      setSourceChain,
      source,
      dest,
      ready,
      canMigrate,
      claim,
      sol,
    }),
    [sourceChain, connection, source, dest, ready, canMigrate, sol],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMigration() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useMigration must be used within <MigrationProvider>");
  return ctx;
}
