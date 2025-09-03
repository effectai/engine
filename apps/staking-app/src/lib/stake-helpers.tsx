export function calculateStakeAge(timestampSec: number) {
  const nowSec = Date.now() / 1000;
  const stakeAge = (nowSec - timestampSec) / 100;
  const maxStakeAge = (1000 * 24 * 60 * 60) / 100;
  return Math.min(Math.max(stakeAge, 0), maxStakeAge);
}

import type { VestingAccount } from "@effectai/vesting";
import type { Account, TokenBalance } from "@solana/kit";
import { useEffect, useRef, useState } from "react";

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
  yourStake,
  totalStaked,
  totalRewards,
}: {
  yourStake: bigint;
  totalStaked: bigint;
  totalRewards: number;
}) {
  const parsedTotalStaked = Number(totalStaked) / 1e6;
  const parsedTotalRewards = totalRewards / 1e6;

  const totalApy =
    parsedTotalStaked > 0 ? (parsedTotalRewards / parsedTotalStaked) * 100 : 0;

  return totalApy;
}

// Calculate due vested amount
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
