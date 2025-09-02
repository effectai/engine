export function calculateStakeAge(timestampSec: number) {
  const nowSec = Date.now() / 1000;
  const stakeAge = (nowSec - timestampSec) / 100;
  const maxStakeAge = (1000 * 24 * 60 * 60) / 100;
  return Math.min(Math.max(stakeAge, 0), maxStakeAge);
}

import type { VestingAccount } from "@effectai/vesting";
import type { Account } from "@solana/kit";
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
  const parsedStake = Number(yourStake) / 1e6;
  const parsedTotalStaked = Number(totalStaked) / 1e6;

  const yourStakePercentage = parsedStake / parsedTotalStaked;
  const yourTotalRewards = yourStakePercentage * totalRewards;
  const totalApy = (yourTotalRewards / parsedStake) * 100;

  return totalApy.toFixed(2);
}

// Calculate due vested amount
export const calculateDue = (
  vestingAccount: Account<VestingAccount>,
  amountAvailable: number,
): number => {
  const { startTime, releaseRate, distributedTokens } = vestingAccount.data;
  const now = Math.floor(new Date().getTime() / 1000);

  if (now < startTime) {
    return 0;
  }

  const poolAmount = (BigInt(now) - startTime) * releaseRate;
  const amountDue = Number(poolAmount - distributedTokens);

  return Math.min(amountDue, amountAvailable * 1_000_000);
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
  const reward = reflection / rate - weightedAmount;
  return Number(reward) / 1e6;
}
