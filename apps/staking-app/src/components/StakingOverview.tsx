import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@effectai/ui";
import { Badge } from "@effectai/ui";
import { Alert, AlertDescription, AlertTitle } from "@effectai/ui";
import { Separator } from "@effectai/ui";
import { CheckCircle2, Gift, Coins, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatNumber, Stat, Row } from "@/lib/helpers.tsx";
import type { Account } from "@solana/kit";
import type { StakeAccount } from "@effectai/stake";
import {
  deriveRewardAccountsPda,
  fetchMaybeReflectionAccount,
  fetchReflectionAccount,
  type ReflectionAccount,
} from "@effectai/reward";
import { EFFECT } from "@/lib/useEffectConfig";
import { address as toAddress } from "@solana/kit";
import { useSolanaContext } from "@/providers/SolanaProvider";
import { useAnimatedStakeAge } from "@/lib/stake-age";

type Props = {
  stakeAccount: Account<StakeAccount> | null;
  pendingRewards: number;
  tokenSymbol?: string;
  rewardTokenSymbol?: string;
  apy?: number | null;
  canClaim?: boolean;
  isClaiming?: boolean; // loading state for claim
  lowSolBalance?: boolean; // warn about fees
  onClaim: () => Promise<void> | void; // claim handler
  className?: string;
};

export function StakeOverview({
  stakeAccount,
  pendingRewards,
  tokenSymbol = "EFFECT",
  rewardTokenSymbol = tokenSymbol,
  apy = null,
  canClaim = pendingRewards > 0,
  isClaiming = false,
  lowSolBalance = false,
  onClaim,
  className,
}: Props) {
  const { connection } = useSolanaContext();

  const [reflectionAccount, setReflectionAccount] =
    React.useState<Account<ReflectionAccount> | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (stakeAccount && connection) {
          const { reflectionAccount } = await deriveRewardAccountsPda({
            mint: toAddress(EFFECT.EFFECT_SPL_MINT),
          });

          const account = await fetchReflectionAccount(
            connection.rpc,
            reflectionAccount,
          );

          if (mounted) setReflectionAccount(account);
        } else {
          if (mounted) setReflectionAccount(null);
        }
      } catch (e) {
        console.error("Failed to calculate reflection", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [stakeAccount, connection]);

  const stakeAge = useAnimatedStakeAge(
    Number(stakeAccount?.data.stakeStartTime) ?? 0,
  );

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
            value={`${formatNumber(Number(stakeAccount.data.amount / BigInt(1e6)))} ${tokenSymbol}`}
          />
          <Stat
            icon={<Gift className="" />}
            label="Stake Score"
            value={`${formatNumber(stakeAge)}`}
            emphasis
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
          <Row label="Total Staked" value="100" />
          <p className="font-bold">Rewards</p>
          <Row
            label="Pending Rewards"
            value={`${formatNumber(pendingRewards)} ${rewardTokenSymbol}`}
          />
          <Row label="Estimated APY" value="15%" />
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
