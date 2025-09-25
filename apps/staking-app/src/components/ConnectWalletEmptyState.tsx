import { ShieldCheck, Wallet, Gift } from "lucide-react";
import { Button } from "@effectai/react"; // if you use it elsewhere

const openWalletModal = () => {
  const btn = document.querySelector('[data-slot="button"]') as HTMLElement;
  if (btn) {
    btn.click();
  }
};

export function ConnectWalletEmptyState() {
  return (
    <div className="relative">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-white/30 dark:to-white/5" />
      <div className="mx-auto w-full max-w-2xl">
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 sm:p-8">
          {/* subtle gradient border accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <Wallet className="h-6 w-6" aria-hidden="true" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Effect AI: Staking App
            </h2>
            <p className="mt-2 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
              Connect a wallet to manage staking View your staked balance,
              pending rewards, and unstaking details.
            </p>

            <div className="mt-5">
              <Button
                onClick={openWalletModal}
                variant="default"
                size="lg"
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </div>

            {/* quick benefits */}
            <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200/70 p-3 text-left text-sm dark:border-neutral-800">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Secure by design
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Offers non-custodial staking with your own wallet.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200/70 p-3 text-left text-sm dark:border-neutral-800">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <Gift className="h-4 w-4" />
                  Real-time rewards
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Track reflections and claimable rewards at a glance.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200/70 p-3 text-left text-sm dark:border-neutral-800">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  On-chain data
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  See APR, and staking scores straight from on-chain data.
                </p>
              </div>
            </div>

            {/* helper / docs link row */}
            <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500">
              <span>Need a wallet?</span>
              <a
                href="https://solana.com/ecosystem/wallets"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-4 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Browse options
              </a>
              <span aria-hidden>•</span>
              <button
                className="underline decoration-dotted underline-offset-4 hover:text-neutral-700 dark:hover:text-neutral-300"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Learn about staking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
