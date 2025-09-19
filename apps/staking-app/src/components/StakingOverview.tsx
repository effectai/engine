import React, { useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
  useGetEffectTokenAccount,
  useConnectionContext,
  useWalletContext,
} from "@effectai/react";

import { CheckCircle2, Gift, Coins, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatNumber, Stat, Row } from "@/lib/utils.tsx";
import type { Account, MaybeAccount } from "@solana/kit";
import type { StakeAccount } from "@effectai/staking";
import type { ReflectionAccount, RewardAccount } from "@effectai/reward";

import {
  calculateApy,
  calculateDue,
  calculatePendingRewards,
  useAnimatedStakeAge,
} from "@/lib/utils";

import type { VestingAccount } from "@effectai/vesting";
import { useClaimRewardMutation } from "@/lib/useMutations";
import {
  useGetInterMediaryRewardVaultBalance,
  useGetVestingVaultBalance,
} from "@/lib/useQueries";
import { useCallback } from "react";

type Props = {
  stakeAccount: Account<StakeAccount> | null | undefined;
  reflectionAccount: Account<ReflectionAccount> | null | undefined;
  vestingAccount: Account<VestingAccount> | null | undefined;
  rewardAccount: MaybeAccount<RewardAccount> | null | undefined;
  isLoading?: boolean; // loading state for stake account
  lowSolBalance?: boolean; // warn about fees
  className?: string;
};

export function StakeOverview({
  stakeAccount,
  reflectionAccount,
  rewardAccount,
  vestingAccount,
  isLoading = false,
  lowSolBalance = false,
  className,
}: Props) {
  const { connection } = useConnectionContext();
  const { signer, address } = useWalletContext();

  const { data: intermediaryVaultBalance } =
    useGetInterMediaryRewardVaultBalance(connection);

  const { data: vestingVaultBalance } = useGetVestingVaultBalance(
    connection,
    vestingAccount,
  );

  const apy = calculateApy({
    totalStaked: reflectionAccount?.data.totalWeightedAmount ?? BigInt(0),
    totalRewards: Number(
      (vestingAccount?.data.releaseRate ?? 0n) * 86400n * 30n * 12n,
    ),
  });

  const toNumberTokens = (micro: bigint) => Number(micro) / 1e6;

  const pendingRewards = useMemo(() => {
    if (!rewardAccount?.exists) return 0;

    const weighted: bigint = rewardAccount.data.weightedAmount ?? 0n;
    const reflection: bigint = rewardAccount?.data.reflection ?? 0n;

    const totalWeighted: bigint =
      reflectionAccount?.data.totalWeightedAmount ?? 0n;
    const rate: bigint = reflectionAccount?.data.rate ?? 1n;

    // 1) pending from reflections
    const pendingMicro: bigint = weighted
      ? calculatePendingRewards({
          reflection,
          rate,
          weightedAmount: weighted,
        })
      : 0n;

    // 2) globally due from vesting
    const dueGlobalMicro: bigint =
      vestingAccount && vestingVaultBalance != null
        ? calculateDue(vestingAccount, Number(vestingVaultBalance?.amount)) // <- returns micro
        : 0n;

    // 3) the users pro-rata share of that global due
    const userShareDueMicro: bigint =
      dueGlobalMicro > 0n && totalWeighted > 0n && weighted > 0n
        ? (dueGlobalMicro * weighted) / totalWeighted
        : 0n;

    // 4) plus any per-user intermediary vault balance accrued
    const intermediaryMicro: bigint =
      BigInt(Number(intermediaryVaultBalance?.amount)) ?? 0n;

    const totalMicro = pendingMicro + userShareDueMicro + intermediaryMicro;
    return toNumberTokens(totalMicro);
  }, [
    rewardAccount?.exists,
    rewardAccount?.data?.weightedAmount,
    reflectionAccount?.data?.totalWeightedAmount,
    reflectionAccount?.data?.rate,
    vestingAccount,
    vestingVaultBalance,
    intermediaryVaultBalance,
  ]);

  const canClaim = Boolean(
    rewardAccount?.exists &&
      pendingRewards &&
      pendingRewards > 0 &&
      vestingAccount,
  );

  const StakeScoreStat = React.memo(function StakeScoreStat({
    stakeStart,
  }: { stakeStart: number }) {
    const stakeAge = useAnimatedStakeAge(stakeStart);
    return (
      <Stat
        icon={<Gift className="" />}
        label="Stake Score"
        value={`${formatNumber(stakeAge)}`}
        emphasis
      />
    );
  });

  const { mutateAsync: claimRewards, isPending: isClaiming } =
    useClaimRewardMutation();

  const { data: recipientTokenAccount } = useGetEffectTokenAccount(
    connection,
    address,
  );

  const onClaim = useCallback(() => {
    if (!canClaim) return;
    if (!stakeAccount) throw new Error("No stake account");
    if (!vestingAccount) throw new Error("No vesting account");
    if (!rewardAccount) throw new Error("No reward account");
    if (!signer) throw new Error("No signer");
    if (!connection) throw new Error("No connection");
    if (!recipientTokenAccount) throw new Error("No recipient token account");

    claimRewards({
      recipientTokenAccount,
      stakeAccountAddress: stakeAccount.address,
      connection,
      signer,
    });
  }, [
    recipientTokenAccount,
    canClaim,
    claimRewards,
    connection,
    rewardAccount,
    signer,
    stakeAccount,
    vestingAccount,
  ]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Staking Overview
            </CardTitle>
            <CardDescription>
              Your current stake and rewards status
            </CardDescription>
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">
            {apy != null ? `APY ~ ${formatPercent(apy)}` : "Active"}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        {/* Stats grid */}

        <div className="grid gap-3 sm:grid-cols-1">
          <Stat
            icon={<Coins className="h-4 w-4" />}
            label="Currently staked"
            value={
              isLoading
                ? "-" // loading state
                : !stakeAccount
                  ? "0" // no stake account
                  : `${formatNumber(
                      Number(stakeAccount.data.amount / BigInt(1e6)),
                    )} EFFECT`
            }
          />
          <StakeScoreStat
            stakeStart={Number(stakeAccount?.data.stakeStartTime)}
          />
        </div>

        {lowSolBalance && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Small network fee required</AlertTitle>
            <AlertDescription>
              Your SOL balance looks low. Keep a little SOL to cover the claim
              transaction fee.
            </AlertDescription>
          </Alert>
        )}
        <div className="mt-6 rounded-xl border bg-muted/30 px-3 py-4 space-y-2 text-sm">
          <p className="font-bold">Details</p>
          <Row
            label="Your Stake"
            value={
              stakeAccount
                ? `${formatNumber(Number(stakeAccount.data.amount / BigInt(1e6)))} EFFECT`
                : "-"
            }
          />
          <Row
            label="Total EFFECT Staked"
            value={
              reflectionAccount?.exists
                ? `${formatNumber(Number(reflectionAccount?.data.totalWeightedAmount / BigInt(1e6)))} EFFECT`
                : "-"
            }
          />
          <p className="font-bold">Rewards</p>
          <Row
            label="Pending Rewards"
            value={`${formatNumber(pendingRewards)} EFFECT`}
          />
          <Row
            label="Estimated APY"
            value={apy != null ? `${formatPercent(apy)}` : "-"}
          />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-2">
        <Button
          onClick={onClaim}
          disabled={!canClaim || isClaiming}
          className="group"
        >
          {isClaiming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Claiming…
            </>
          ) : (
            <>
              Claim rewards
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
