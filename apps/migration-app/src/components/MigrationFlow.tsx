"use client";
import { useMigrationStore } from "@/stores/migrationStore";
import { Button, useProfileContext } from "@effectai/react";

import { SNAPSHOT_DATE } from "@/consts";
import { decodeAuthorizePayload } from "@/lib/utils";
import { type StepDef, Stepper } from "./Stepper";
import { AuthenticateStep } from "./steps/AuthenticateStep";
import { AuthorizeStep } from "./steps/AuthorizeStep";
import { ClaimStep } from "./steps/ClaimStep";
import { SolanaDestinationStep } from "./steps/DestinationStep";

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
  const { currentStep, goTo } = useMigrationStore();
  const snapshotDate = new Date(SNAPSHOT_DATE).toLocaleDateString();

  //unpack and decode auth parameters from URL (if any)
  const url = new URL(window.location.href);
  const auth = url.searchParams.get("auth");

  const setForeignPublicKey = useMigrationStore((s) => s.setForeignPublicKey);
  const setMessage = useMigrationStore((s) => s.setMessage);
  const setSignature = useMigrationStore((s) => s.setSignature);
  const { mint } = useProfileContext();

  if (auth) {
    const decoded = decodeAuthorizePayload(auth);
    if (decoded) {
      if (currentStep !== "claim") {
        setForeignPublicKey(decoded.foreignPublicKey, mint);
        setMessage(decoded.message);
        setSignature(decoded.signature);
        goTo("claim");
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {currentStep === "intro" && (
        <section id="step-intro" className="prose dark:prose-invert mt-12">
          <h1 className="">Migrate Your $EFX Tokens to Solana</h1>
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

      {currentStep !== "intro" && (
        <Stepper
          steps={steps}
          current={currentStep}
          onStepChange={(s) => goTo(s as any)}
        >
          {/* AUTHENTICATE */}
          {currentStep === "authenticate" && <AuthenticateStep />}

          {/* SOLANA DESTINATION */}
          {currentStep === "solana" && <SolanaDestinationStep />}

          {/* AUTHORIZE */}
          {currentStep === "authorize" && <AuthorizeStep />}

          {/* CLAIM */}
          {currentStep === "claim" && <ClaimStep />}
        </Stepper>
      )}
    </div>
  );
}
