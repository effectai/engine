"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, useWalletContext } from "@effectai/react";

import { useMigration } from "@/providers/MigrationProvider";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import {
  address as toAddress,
  type Address,
  type EncodedAccount,
} from "@solana/kit";

import {
  deriveMigrationAccountPDA,
  fetchMaybeMigrationAccount,
} from "@effectai/migration";
import { Stepper, type StepDef } from "./Stepper";
import { AuthenticateStep } from "./steps/AuthenticateStep";
import { SolanaDestinationStep } from "./steps/DestinationStep";
import { AuthorizeStep } from "./steps/AuthorizeStep";
import { ClaimStep } from "./steps/ClaimStep";

const steps: StepDef[] = [
  { key: "intro", label: "Intro", hidden: true },
  {
    key: "authenticate",
    label: "Source",
    description: "Attach your source wallet",
  },
  { key: "solana", label: "Destination" },
  { key: "authorize", label: "Authorize" },
  { key: "claim", label: "Claim" },
];

// ---- Main Migration Flow ----
export default function MigrationFlow() {
  const { address } = useWalletContext();
  const { source, sourceChain, config, connection, claim, sol } =
    useMigration();

  // UI state
  const [current, setCurrent] = useState<Step>("intro");
  const [toggleManualAddress, setToggleManualAddress] = useState(false);
  const [manualAddressInput, setManualAddressInput] = useState("");
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null,
  );

  const [signature, setSignature] = useState<Uint8Array | null>(null);
  const [message, setMessage] = useState<Uint8Array | null>(null);
  const [foreignPublicKey, setForeignPublicKey] = useState<Uint8Array | null>(
    null,
  );

  const [nativeBalance, setNativeBalance] = useState<{
    value: number;
    symbol: string;
  } | null>(null);
  const [efxBalance, setEfxBalance] = useState<{
    value: number;
    symbol: string;
  } | null>(null);

  const [migrationVaultAddress, setMigrationVaultAddress] = useState<
    string | null
  >(null);

  const [migrationVaultBalance, setMigrationVaultBalance] = useState<
    number | null
  >(null);

  const [migrationAccount, setMigrationAccount] = useState<Awaited<
    ReturnType<typeof fetchMaybeMigrationAccount>
  > | null>(null);

  const snapshotDate = useMemo(() => new Date("2025-01-01T12:00:00Z"), []);
  const hasSolanaWalletInstalled = useMemo(
    () => typeof window !== "undefined" && !!(window as any).solana,
    [],
  );

  //TODO:: FETCH SOL BALANCE
  const balanceLow = false;

  // Load balances for source when connected
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (source.isConnected) {
        try {
          const [n, e] = await Promise.all([
            source.getNativeBalance(),
            source.getEfxBalance(),
          ]);
          if (mounted) {
            setNativeBalance(n);
            setEfxBalance(e);
          }
        } catch (e) {
          // noop
        }
      } else {
        setNativeBalance(null);
        setEfxBalance(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [source.isConnected, sourceChain]);

  //Fetch migration vault account balance when migration account is set
  const goTo = (s: Step) => setCurrent(s);

  const selectAddress = useCallback(() => {
    if (!manualAddressInput) return;
    setDestinationAddress(manualAddressInput.trim());
    setToggleManualAddress(false);
    goTo("authorize");
  }, [manualAddressInput]);

  useEffect(() => {
    if (address) {
      setDestinationAddress(address);
    }
  }, [address]);

  const disconnectSourceWallets = useCallback(async () => {
    await source.disconnect();
    setNativeBalance(null);
    setEfxBalance(null);
    setSignature(null);
    setMessage(null);
    setForeignPublicKey(null);
    goTo("authenticate");
  }, [source]);

  const authorize = useCallback(async () => {
    if (!destinationAddress) throw new Error("No destination address");
    const { foreignPublicKey, signature, message } =
      await source.authorizeTokenClaim(destinationAddress);
    setForeignPublicKey(foreignPublicKey);
    setSignature(signature);
    setMessage(message);

    const { migrationAccount: derivedMigrationAccountAddress, vaultAccount } =
      await deriveMigrationAccountPDA({
        foreignAddress: foreignPublicKey,
        mint: toAddress(config.EFFECT_SPL_MINT),
      });

    const migrationAccountData = await fetchMaybeMigrationAccount(
      connection.rpc,
      derivedMigrationAccountAddress,
    );

    if (migrationAccountData.exists) {
      setMigrationVaultAddress(vaultAccount);
      setMigrationAccount(migrationAccountData);
    }

    goTo("claim");
  }, [source, destinationAddress, sourceChain, connection, config]);

  // Mobile/share helpers used in claim step (optional)
  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Mobi|Android/i.test(navigator.userAgent);
  }, []);

  const authorizeUrl = useMemo(() => {
    if (!signature || !message || !foreignPublicKey) return "";
    const payload = Buffer.from(
      JSON.stringify({ signature, message, foreignPublicKey }),
    ).toString("base64");
    return `${typeof window !== "undefined" ? window.location.origin : ""}/migrate?auth=${payload}`;
  }, [signature, message, foreignPublicKey]);

  const shareAuthorize = useCallback(async () => {
    if (navigator.share && authorizeUrl) {
      await navigator.share({ title: "EFFECT Migration", url: authorizeUrl });
    }
  }, [authorizeUrl]);

  const copyAuthorize = useCallback(async () => {
    if (!authorizeUrl) return;
    await navigator.clipboard.writeText(authorizeUrl);
  }, [authorizeUrl]);

  return (
    <div className="max-w-5xl mx-auto">
      {current === "intro" && (
        <section id="step-intro" className="prose dark:prose-invert mt-12">
          <h1 className="text-primary">Migrate Your $EFX Tokens to Solana</h1>
          <p>Welcome to the official $EFX → $EFFECT token migration portal!</p>
          <p>
            As you may know by now, Effect AI is migrating its native token to
            the <u>Solana</u> blockchain. This new token represents a fresh
            start for our mission to enhance human intelligence in the AI era.
          </p>
          <p>
            Following the steps below, you will be able to migrate your old $EFX
            tokens to the new $EFFECT token on the Solana blockchain. This claim
            portal will be open forever, so you can claim your new tokens at any
            time. Just remember that only tokens held on{" "}
            <b>{snapshotDate.toLocaleString()}</b> are eligible for migration.
          </p>

          <div className="mt-5">
            <p className="font-medium">What You’ll Need:</p>
            <ul className="list-disc pl-5">
              <li>
                Access to the BSC or EOS account holding your $EFX tokens.
              </li>
              <li>A Solana-compatible wallet (e.g., Phantom, Backpack).</li>
              <li>A small amount of SOL to make the claim.</li>
              <li>A few minutes to complete the process.</li>
            </ul>
          </div>

          <p className="mt-5">
            Let’s get started! Click “Begin Migration” below to start your
            journey to the Solana blockchain.
          </p>
          <Button className="mt-5" onClick={() => goTo("authenticate")}>
            Begin Migration
          </Button>

          <p className="text-xs mt-10 italic">
            If you have questions or encounter issues during the migration, our
            support team is here to help. Reach us on
            <a
              className="underline ml-1"
              href="https://t.me/effectai"
              target="_blank"
            >
              Telegram
            </a>{" "}
            /
            <a
              className="underline ml-1"
              href="https://discord.gg/effectnetwork"
              target="_blank"
            >
              Discord
            </a>
            .
          </p>
          <p className="mt-1 text-xs italic">
            <b>IMPORTANT</b>: Beware of <u>scammers</u> pretending to be
            support. We will never DM you first or ask for your private keys /
            seed phrases.
          </p>
        </section>
      )}

      {current !== "intro" && (
        <Stepper steps={steps} current={current} onStepChange={(s) => goTo(s)}>
          {/* AUTHENTICATE */}
          {current === "authenticate" && (
            <AuthenticateStep
              current="authenticate"
              source={source}
              goTo={goTo}
              nativeBalance={nativeBalance}
              efxBalance={efxBalance}
              snapshotDate={snapshotDate}
              foreignPublicKey={foreignPublicKey}
              disconnectSourceWallets={disconnectSourceWallets}
            />
          )}

          {/* SOLANA DESTINATION */}
          {current === "solana" && (
            <SolanaDestinationStep
              current="solana"
              hasSolanaWalletInstalled={hasSolanaWalletInstalled}
              destinationAddress={destinationAddress}
              setDestinationAddress={setDestinationAddress}
              manualAddressInput={manualAddressInput}
              setManualAddressInput={setManualAddressInput}
              selectAddress={selectAddress}
              balanceLow={balanceLow}
              goTo={goTo}
            />
          )}

          {/* AUTHORIZE */}
          {current === "authorize" && source.address && (
            <AuthorizeStep
              sourceAddress={source.address}
              signature={signature}
              authorize={authorize}
              current="authorize"
              goTo={goTo}
              foreignPublicKey={foreignPublicKey}
            />
          )}

          {/* CLAIM */}
          {current === "claim" && (
            <ClaimStep
              solanaWalletAddress={solanaWalletAddress}
              claim={claim}
              copyAuthorize={copyAuthorize}
              shareAuthorize={shareAuthorize}
              authorizeUrl={authorizeUrl}
              current="claim"
              isMobile={isMobile}
              hasSolanaWalletInstalled={hasSolanaWalletInstalled}
              disconnectSourceWallets={disconnectSourceWallets}
              source={source}
              message={message}
              migrationVaultBalance={migrationVaultBalance}
              migrationAccount={migrationAccount}
            />
          )}
        </Stepper>
      )}
    </div>
  );
}
