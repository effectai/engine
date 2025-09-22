import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { VestingAccount } from "@effectai/vesting";
import type { Account } from "@solana/kit";
import { useEffect, useRef, useState } from "react";

export {
  formatNumber,
  formatPercent,
  shorten,
  trimTrailingZeros,
} from "@effectai/react";

import { toast } from "@effectai/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function Stat({
  icon,
  label,
  value,
  emphasis = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold",
          emphasis && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function useAnimatedStakeAge(stakeStartAtSec: number) {
  const [age, setAge] = useState(() => calculateStakeAge(stakeStartAtSec));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setAge(calculateStakeAge(stakeStartAtSec));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [stakeStartAtSec]);

  return age;
}

export function calculateApy({
  totalStaked,
  totalRewards,
}: {
  totalStaked: bigint;
  totalRewards: number;
}) {
  const parsedTotalStaked = Number(totalStaked) / 1e6;
  const parsedTotalRewards = totalRewards / 1e6;

  const totalApy =
    parsedTotalStaked > 0 ? (parsedTotalRewards / parsedTotalStaked) * 100 : 0;

  return totalApy;
}

export const calculateDue = (
  vestingAccount: Account<VestingAccount>,
  amountAvailable: number,
): bigint => {
  const { startTime, releaseRate, distributedTokens } = vestingAccount.data;
  const now = Math.floor(new Date().getTime() / 1000);

  if (now < startTime) {
    return 0n;
  }

  const poolAmount = (BigInt(now) - startTime) * releaseRate;
  const amountDue = Number(poolAmount - distributedTokens);

  return BigInt(Math.min(amountDue, amountAvailable));
};

export function calculatePendingRewards({
  reflection,
  rate,
  weightedAmount,
}: {
  reflection: bigint;
  rate: bigint;
  weightedAmount: bigint;
}) {
  return reflection / rate - weightedAmount;
}

export function calculateStakeAge(timestampSec: number) {
  const nowSec = Date.now() / 1000;
  const stakeAge = (nowSec - timestampSec) / 100;
  const maxStakeAge = (1000 * 24 * 60 * 60) / 100;
  return Math.min(Math.max(stakeAge, 0), maxStakeAge);
}

export const notifyTransactionSuccess = (
  signature: string,
  title: string,
  description: string,
  cluster: string,
) => {
  toast(title, {
    description,
    action: {
      label: "View on Explorer",
      onClick: () => {
        const url = `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
        window.open(url, "_blank", "noopener,noreferrer");
      },
    },
  });
};
