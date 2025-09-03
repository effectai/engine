import * as React from "react";
import { Card, CardContent } from "@effectai/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, Download, Lock } from "lucide-react";
import type { VestingAccount } from "@effectai/vesting";
import type { Account } from "@solana/kit";
import { useClaimVestingMutation } from "@/lib/useMutations";
import {
  useGetEffectTokenAccount,
  useGetVestingVaultBalance,
} from "@/lib/useQueries";
import { useConnectionContext } from "@/providers/ConnectionContextProvider";
import { useWalletContext } from "@/providers/WalletContextProvider";

/** Compact vesting item (single-row, dense, with countdown + progress) */
export function VestingScheduleItem({
  vestingAccount,
  isClaiming = false,
  tokenSymbol = "EFFECT",
  decimals = 6,
  className,
}: {
  vestingAccount: Account<VestingAccount>;
  isClaiming?: boolean;
  tokenSymbol?: string;
  decimals?: number;
  className?: string;
}) {
  const { signer, address } = useWalletContext();
  const { connection } = useConnectionContext();

  const startSec = Number(vestingAccount.data.startTime ?? 0);
  const ratePerSec = vestingAccount.data.releaseRate;
  const ratePerDay = mulBigInt(ratePerSec, 86400n);

  const { data: recipientTokenAccount } = useGetEffectTokenAccount(
    connection,
    address,
  );
  const { mutateAsync: claim } = useClaimVestingMutation();
  const { data: balance } = useGetVestingVaultBalance(
    connection,
    vestingAccount,
  );

  // live ticking (1s is enough and cheaper than rAF)
  const nowSec = useNowSeconds();
  const locked = nowSec < startSec;
  const secondsToUnlock = Math.max(0, startSec - nowSec);

  // math (clamped to total = claimed + vault balance)
  const claimed = vestingAccount.data.distributedTokens ?? 0n;
  const total = claimed + (balance ?? 0n);
  const elapsed = locked ? 0 : Math.max(0, nowSec - startSec);
  const theoreticalReleased = mulBigInt(ratePerSec, BigInt(elapsed));
  const released = theoreticalReleased > total ? total : theoreticalReleased;

  let claimable = released > claimed ? released - claimed : 0n;
  if (balance != null && claimable > balance) claimable = balance;

  const progress = total > 0n ? (Number(released) / Number(total)) * 100 : 0;

  const onClaim = React.useCallback(async () => {
    if (claimable <= 0n || locked) return;
    if (!signer) throw new Error("No signer");
    if (!recipientTokenAccount) throw new Error("No recipient token account");
    await claim({ vestingAccount, signer, recipientTokenAccount, connection });
  }, [
    claim,
    claimable,
    locked,
    signer,
    recipientTokenAccount,
    vestingAccount,
    connection,
  ]);

  return (
    <Card className={cn("w-full shadow-none py-0", className)}>
      <CardContent className="p-1 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-2">
          {/* Top row: title + time + claimable & button */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {locked ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Unlocks in</span>
                  <span className="font-mono text-foreground">
                    {formatDuration(secondsToUnlock)}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Started</span>
                  <span className="font-mono text-foreground">
                    {startSec > 0
                      ? new Date(startSec * 1000).toLocaleString()
                      : "—"}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 w-full">
              {/* Claimable pill */}
              <div
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  claimable > 0n
                    ? "bg-primary/15 text-foreground"
                    : "bg-muted text-muted-foreground",
                )}
                title="Claimable now"
              >
                {formatNumber(fromBaseUnits(claimable, decimals))} {tokenSymbol}
              </div>

              <Button
                size="sm"
                onClick={onClaim}
                disabled={locked || claimable <= 0n || isClaiming}
                className="h-8"
              >
                {isClaiming ? "Claiming…" : "Claim"}
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bottom row: thin progress */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span>{total > 0n ? `${progress.toFixed(1)}%` : "—"}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- compact helpers ---------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-2.5 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function useNowSeconds() {
  const [now, setNow] = React.useState(() => Math.floor(Date.now() / 1000));
  React.useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${sec}s`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatNumber(n: number, maxFrac = 6) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function fromBaseUnits(amount: bigint, decimals: number): number {
  if (decimals <= 0) return Number(amount);
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const keep = BigInt(Math.min(decimals, 9));
  const scale = 10n ** keep;
  const scaled = (frac * scale) / base;
  return Number(whole) + Number(scaled) / Number(scale);
}

function mulBigInt(a: bigint, b: bigint) {
  return a * b;
}
