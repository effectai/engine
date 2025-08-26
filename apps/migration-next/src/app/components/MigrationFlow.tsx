"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import clsx from "clsx";

import { useMigration } from "@/app/providers/MigrationProvider";
import type { SourceChain } from "@/lib/wallet-types";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

import {
  deriveMigrationAccountPDA,
  fetchMaybeMigrationAccount,
  type MigrationAccount,
} from "@effectai/migration";

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "outline";
    color?: "neutral" | "black" | "danger";
  },
) {
  const { className, variant = "solid", color = "neutral", ...rest } = props;
  const base =
    "px-4 py-2 rounded-2xl text-sm transition border disabled:opacity-50 disabled:cursor-not-allowed";
  const palette =
    color === "black"
      ? variant === "outline"
        ? "border-black text-black bg-transparent hover:bg-black/5"
        : "bg-black text-white border-black hover:bg-black/90"
      : color === "danger"
        ? variant === "outline"
          ? "border-red-500 text-red-500 hover:bg-red-50"
          : "bg-red-500 text-white border-red-500 hover:bg-red-600"
        : // neutral
          variant === "outline"
          ? "border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
          : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900";
  return <button className={clsx(base, palette, className)} {...rest} />;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "px-3 h-10 rounded-md border flex-1 min-w-0",
        "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
        props.className,
      )}
    />
  );
}

function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-2xl border p-4 shadow-sm bg-white/70 dark:bg-zinc-900/60",
        "border-zinc-200 dark:border-zinc-800",
        props.className,
      )}
    />
  );
}

function BlockchainAddress({ address }: { address: string }) {
  const short = useMemo(
    () =>
      address.length > 12
        ? `${address.slice(0, 6)}…${address.slice(-6)}`
        : address,
    [address],
  );
  return (
    <code className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
      {short}
    </code>
  );
}

const steps = ["authenticate", "destination", "authorize", "claim"] as const;
type Step = (typeof steps)[number];

function Stepper({
  current,
  children,
}: {
  current: Step;
  children: React.ReactNode;
}) {
  const idx = steps.indexOf(current);
  return (
    <div>
      <ol className="flex gap-2 text-xs text-zinc-500">
        {steps.map((s, i) => (
          <li
            key={s}
            className={clsx(
              "flex items-center gap-2",
              i <= idx ? "text-zinc-900 dark:text-zinc-100" : "",
            )}
          >
            <span
              className={clsx(
                "w-5 h-5 rounded-full border flex items-center justify-center",
                i < idx
                  ? "bg-green-500 border-green-500 text-white"
                  : i === idx
                    ? "border-zinc-400"
                    : "border-zinc-300",
              )}
            >
              {i + 1}
            </span>
            <span className="capitalize hidden sm:inline">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ConnectSourceWalletForm() {
  const { sourceChain, setSourceChain, source } = useMigration();
  const [pendingConnect, setPendingConnect] = useState<SourceChain | null>(
    null,
  );

  useEffect(() => {
    if (
      pendingConnect &&
      sourceChain === pendingConnect &&
      !source.isConnected
    ) {
      source.connect();
      setPendingConnect(null);
    }
  }, [sourceChain, pendingConnect, source]);

  const onClick = (chain: SourceChain) => {
    setPendingConnect(chain);
    setSourceChain(chain);
  };

  return (
    <div className="flex flex-col gap-3">
      {source.isConnected ? (
        <div className="text-sm">
          Connected to <b>{source.walletMeta?.chain}</b> wallet.
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            variant="solid"
            onClick={() => onClick("BSC")}
            className="flex items-center gap-1"
          >
            <img src="/bsc.svg" alt="BSC" className="h-4 w-4" />
            BSC
          </Button>

          <Button
            variant="outline"
            onClick={() => onClick("EOS")}
            className="flex items-center gap-1"
          >
            <img src="/eos.svg" alt="EOS" className="h-4 w-4" />
            EOS
          </Button>
        </div>
      )}
    </div>
  );
}
function WalletCard(props: {
  address: string;
  chainLabel: string;
  onDisconnect: () => void | Promise<void>;
  nativeBalance?: { value: number; symbol: string } | null;
  efxBalance?: { value: number; symbol: string } | null;
}) {
  const { address, chainLabel, onDisconnect, nativeBalance, efxBalance } =
    props;
  return (
    <Card className="w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{chainLabel}</span>
          <BlockchainAddress address={address} />
        </div>
        <Button variant="outline" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded bg-zinc-50 dark:bg-zinc-800 p-2">
          <div className="opacity-70">Native</div>
          <div className="font-mono">
            {nativeBalance
              ? `${nativeBalance.value} ${nativeBalance.symbol}`
              : "—"}
          </div>
        </div>
        <div className="rounded bg-zinc-50 dark:bg-zinc-800 p-2">
          <div className="opacity-70">EFX</div>
          <div className="font-mono">
            {efxBalance ? `${efxBalance.value} ${efxBalance.symbol}` : "—"}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ClaimCard(props: {
  foreignPublicKey: Uint8Array;
  message: Uint8Array;
  signature: Uint8Array;
  migrationAccount: MigrationAccount;
}) {
  return (
    <Card>
      <div className="text-sm">
        <p className="mb-3">
          Ready to claim your new <b>EFFECT</b> tokens on Solana.
        </p>
        <pre className="text-xs overflow-auto p-2 rounded bg-zinc-100 dark:bg-zinc-800">
          {JSON.stringify(
            {
              foreignPublicKey: Buffer.from(props.foreignPublicKey).toString(
                "hex",
              ),
              message: Buffer.from(props.message).toString("hex"),
              signature: Buffer.from(props.signature).toString("hex"),
              migrationAccount: props.migrationAccount,
            },
            null,
            2,
          )}
        </pre>
        <Button className="mt-4">Claim</Button>
      </div>
    </Card>
  );
}

// ---- Main Migration Flow ----
export default function MigrationFlow() {
  const { source, dest, sourceChain } = useMigration();

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

  const [migrationAccount, setMigrationAccount] =
    useState<MigrationAccount | null>(null);

  const snapshotDate = useMemo(() => new Date("2025-01-01T12:00:00Z"), []);
  const hasSolanaWalletInstalled = useMemo(
    () => typeof window !== "undefined" && !!(window as any).solana,
    [],
  );
  const solanaWalletAddress = dest.address ?? null;

  const balanceLow = false; // TODO: fetch SOL balance if desired

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

  // Step helpers
  const goNext = () =>
    setCurrent(
      (prev) => steps[Math.min(steps.indexOf(prev) + 1, steps.length - 1)],
    );
  const goTo = (s: Step) => setCurrent(s);

  const selectAddress = useCallback(() => {
    if (!manualAddressInput) return;
    setDestinationAddress(manualAddressInput.trim());
    setToggleManualAddress(false);
    goNext();
  }, [manualAddressInput]);

  // If user connects Solana wallet via WalletMultiButton, auto-pick that address as destination
  useEffect(() => {
    if (dest.isConnected && dest.address) {
      setDestinationAddress(dest.address);
    }
  }, [dest.isConnected, dest.address]);

  const disconnectSourceWallets = useCallback(async () => {
    await source.disconnect();
    setNativeBalance(null);
    setEfxBalance(null);
    goTo("authenticate");
  }, [source]);

  const authorize = useCallback(async () => {
    if (!destinationAddress) throw new Error("No destination address");
    const { foreignPublicKey, signature, message } =
      await source.authorizeTokenClaim(destinationAddress);
    setForeignPublicKey(foreignPublicKey);
    setSignature(signature);
    setMessage(message);

    // TODO: hit your API to look up migration account proof/state
    // const res = await fetch(`/api/migration-account?addr=${source.address}&chain=${sourceChain}`);
    // setMigrationAccount(await res.json());
    const address = deriveMigrationAccountPDA({
      foreignAddress: foreignPublicKey,
      mint: dest.mintAddress,
    });

    const migrationAccountData = await fetchMaybeMigrationAccount(
      sourceChain,
      String(source.address),
    );

    setMigrationAccount(migrationAccountData);

    goNext();
  }, [source, destinationAddress, sourceChain]);

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

  // ---- RENDER ----
  return (
    <div className="max-w-sm md:max-w-md lg:max-w-xl mx-auto">
      {current === "intro" && (
        <section id="step-intro" className="prose dark:prose-invert mt-12">
          <h2>Migrate Your $EFX Tokens to Solana</h2>
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
        <Stepper current={current}>
          {/* AUTHENTICATE */}
          {current === "authenticate" && (
            <div>
              {!foreignPublicKey ? (
                <div>
                  <div className="my-5 text-sm">
                    <p>
                      To claim your new EFFECT tokens on Solana, you’ll need to{" "}
                      <u>verify ownership</u> of a <b>BSC</b> or
                      <b> EOS</b> account that held or staked EFX tokens on{" "}
                      <b>{snapshotDate.toLocaleString()}</b>. You can repeat
                      this process for every account you own that held or staked
                      EFX tokens.
                    </p>
                  </div>
                  {source.isConnected ? null : <ConnectSourceWalletForm />}

                  {source.isConnected && source.address && (
                    <div className="flex flex-col items-center gap-3 mt-5">
                      <WalletCard
                        address={String(source.address)}
                        chainLabel={source.walletMeta?.chain ?? "Source"}
                        onDisconnect={disconnectSourceWallets}
                        nativeBalance={nativeBalance}
                        efxBalance={efxBalance}
                      />
                      <Button onClick={() => goTo("solana")} className="mt-2">
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {source.isConnected && source.address && (
                    <div className="flex flex-col items-center gap-3 mt-5">
                      <WalletCard
                        address={String(source.address)}
                        chainLabel={source.walletMeta?.chain ?? "Source"}
                        onDisconnect={disconnectSourceWallets}
                        nativeBalance={nativeBalance}
                        efxBalance={efxBalance}
                      />
                    </div>
                  )}

                  <div className="text-center">
                    {!migrationAccount && (
                      <div className="text-red-500 text-lg text-center mt-5">
                        No active claims found for this account.
                      </div>
                    )}
                    {source.walletMeta?.chain === "EOS" && (
                      <div className="mt-5 text-sm">
                        <p className="font-medium">
                          Make sure you are using the correct permission.
                        </p>
                        <p className="text-xs opacity-80">
                          For most accounts the <b>active</b> permission should
                          be used. If your active key is of type R1 or it's a
                          multisig, use your <b>owner</b> permission instead.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={disconnectSourceWallets}
                      className="mt-5"
                      variant="outline"
                      color="black"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOLANA DESTINATION */}
          {current === "solana" && (
            <div className="w-full">
              <p>
                Next, we'll need your Solana address. This is where you'll
                receive your new EFFECT tokens.
              </p>

              {!destinationAddress ? (
                <div>
                  <div className="flex flex-wrap items-center gap-2 my-6">
                    {hasSolanaWalletInstalled && (
                      <>
                        <UnifiedWalletButton />
                        <span className="text-sm opacity-70">or</span>
                      </>
                    )}
                    <a
                      className="text-sm text-red-500 cursor-pointer"
                      onClick={() => setToggleManualAddress((v) => !v)}
                    >
                      Manually enter your address
                    </a>
                  </div>

                  {!hasSolanaWalletInstalled || toggleManualAddress ? (
                    <div className="flex gap-2 w-full mt-3">
                      <Input
                        placeholder="Your Solana address"
                        value={manualAddressInput}
                        onChange={(e) => setManualAddressInput(e.target.value)}
                      />
                      <Button color="black" onClick={selectAddress}>
                        Confirm
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  <b>Chosen address:</b>
                  <div className="flex items-center gap-2">
                    <BlockchainAddress address={destinationAddress} />
                    <span>|</span>
                    <a
                      className="cursor-pointer text-red-500"
                      onClick={() => setDestinationAddress(null)}
                    >
                      Switch
                    </a>
                  </div>
                  {balanceLow && (
                    <p className="text-red-500 mt-3">
                      Your SOL balance is low. Your transaction might fail.
                      Please top up.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={() => goTo("authorize")}
                  disabled={!destinationAddress}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* AUTHORIZE */}
          {current === "authorize" && (
            <div>
              {signature && message && foreignPublicKey ? (
                <p>Successfully authenticated and authorized.</p>
              ) : (
                <div>
                  <p>
                    Authorize the migration of your EFX tokens to the Solana
                    network.
                  </p>
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={authorize}
                  >
                    Authorize
                  </Button>
                </div>
              )}

              {signature && message && foreignPublicKey && (
                <div className="mt-6">
                  <Button onClick={() => goTo("claim")}>
                    Continue to Claim
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* CLAIM */}
          {current === "claim" && (
            <div>
              {!migrationAccount ? (
                <div>
                  {source.address && (
                    <BlockchainAddress address={String(source.address)} />
                  )}
                  <p className="mt-2">
                    No active claims found for this account.
                  </p>
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={disconnectSourceWallets}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col my-5">
                  {isMobile && !hasSolanaWalletInstalled ? (
                    <>
                      <h2 className="text-xl my-3 font-bold">
                        Auth & authorization via your mobile wallet were
                        successful! 🎉
                      </h2>
                      <p>
                        To claim your tokens, we need to establish a connection
                        to the Solana blockchain. Your current browser/app
                        doesn’t support this. Open the link below on a desktop
                        browser or within an in-app browser of a Solana mobile
                        wallet to continue where you left off.
                      </p>
                      <div>
                        <Input readOnly value={authorizeUrl} className="mt-5" />
                        <div className="flex gap-3 justify-center">
                          {navigator && (navigator as any).share && (
                            <Button
                              onClick={shareAuthorize}
                              className="mt-5"
                              variant="outline"
                            >
                              Share Authorization Link
                            </Button>
                          )}
                          <Button
                            onClick={copyAuthorize}
                            className="mt-5"
                            variant="outline"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : !solanaWalletAddress ? (
                    <>
                      <p>Please connect your Solana wallet.</p>
                      <div className="mt-3">
                        <WalletMultiButton />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="my-5">
                        Claim your new EFFECT tokens on Solana.
                      </p>
                      {foreignPublicKey && signature && message && (
                        <ClaimCard
                          foreignPublicKey={foreignPublicKey}
                          message={message}
                          signature={signature}
                          migrationAccount={migrationAccount}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </Stepper>
      )}
    </div>
  );
}
