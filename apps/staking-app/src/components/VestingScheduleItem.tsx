import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@effectai/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, Download } from "lucide-react";
import type { VestingAccount } from "@effectai/vesting";
import { Account } from "@solana/kit";
import { useClaimVestingMutation } from "@/lib/useMutations";
import { useSolanaContext } from "@/providers/SolanaProvider";
import {
  useGetEffectTokenAccount,
  useGetVestingVaultBalance,
} from "@/lib/useQueries";

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
  const { connection, address, signer } = useSolanaContext();

  const { data } = vestingAccount;

  const startSec = Number(data.startTime ?? 0);
  const ratePerSec = data.releaseRate;
  const ratePerDay = mulBigInt(ratePerSec, 86400n);

  const { data: recipientTokenAccount } = useGetEffectTokenAccount(
    connection,
    address,
  );
  const { mutateAsync: claim } = useClaimVestingMutation();

  const onClaim = React.useCallback(() => {
    if (claimable > 0n) {
      if (!signer) throw new Error("No signer");
      if (!vestingAccount) throw new Error("No vesting account");
      if (!recipientTokenAccount) throw new Error("No recipient token account");
      claim({ vestingAccount, signer, recipientTokenAccount, connection });
    }
  }, [claim, connection, recipientTokenAccount, signer, vestingAccount]);

  // Live-updating released + claimable
  const [nowSec, setNowSec] = React.useState(() =>
    Math.floor(Date.now() / 1000),
  );
  React.useEffect(() => {
    let raf: number;
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setNowSec(Math.floor(Date.now() / 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const { data: balance } = useGetVestingVaultBalance(
    connection,
    vestingAccount,
  );

  const total = (vestingAccount.data.distributedTokens ?? 0n) + (balance ?? 0n);

  const elapsed = Math.max(0, nowSec - startSec);
  const theoreticalReleased = mulBigInt(ratePerSec, BigInt(elapsed));
  const released = theoreticalReleased > total ? total : theoreticalReleased;

  const claimed = vestingAccount.data.distributedTokens ?? 0n;
  const claimable = released > claimed ? released - claimed : 0n;

  const rate = ratePerDay;
  const progress = total > 0n ? (Number(released) / Number(total)) * 100 : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Vesting Schedule</CardTitle>
        <CardDescription className="text-sm">
          Linear release since{" "}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {startSec > 0 ? new Date(startSec * 1000).toLocaleString() : "—"}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* Numbers */}
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <KV
            label="Released so far"
            value={`${formatNumber(fromBaseUnits(released, decimals))} ${tokenSymbol}`}
          />
          <KV
            label="Claimed"
            value={`${formatNumber(fromBaseUnits(claimed, decimals))} ${tokenSymbol}`}
          />
          <KV
            label="Claimable now"
            valueClassName={
              claimable > 0n
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }
            value={`${formatNumber(fromBaseUnits(claimable, decimals))} ${tokenSymbol}`}
          />
        </div>

        {/* Progress: claimed of released */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {released > 0n ? `${progress.toFixed(1)}% claimed` : "—"}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Rate */}
        <div className="text-xs text-muted-foreground">
          Release rate ≈{" "}
          <span className="font-medium text-foreground">
            {formatNumber(fromBaseUnits(rate, decimals))} {tokenSymbol}
            /day
          </span>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-end">
          <Button
            onClick={() => onClaim(vestingAccount)}
            disabled={claimable <= 0n || isClaiming}
            className="group"
          >
            {isClaiming ? "Claiming…" : "Claim available"}
            <Download className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- small subcomponents & helpers ---------- */

function KV({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1", valueClassName)}>{value}</div>
    </div>
  );
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
  // keep up to 9 extra fractional digits for precision when converting to number
  const fracDigitsToKeep = BigInt(Math.min(decimals, 9));
  const scale = 10n ** fracDigitsToKeep;
  const scaled = (frac * scale) / base;
  const asNumber = Number(whole) + Number(scaled) / Number(scale);
  return asNumber;
}

function mulBigInt(a: bigint, b: bigint) {
  return a * b;
}

// Divide two bigints to a floating number in [0, +inf)
function divideBigintsToNumber(a: bigint, b: bigint): number {
  if (b === 0n) return 0;
  // scale to keep precision
  const scale = 10_000_000n; // 1e7
  const scaled = (a * scale) / b;
  return Number(scaled) / Number(scale);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
