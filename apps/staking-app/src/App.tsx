import AppShell from "./components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StakeForm } from "./components/StakingForm";
import { StakeOverview } from "./components/StakingOverview";
import { useCallback, useEffect, useState } from "react";
import { useSolanaContext, type Balance } from "./providers/SolanaProvider";
import { useWalletAccountTransactionSigner } from "@solana/react";
import { UnstakeForm } from "./components/UnstakeForm";
import {
  useReflectionAccount,
  useRewardVestingAccount,
  useStakeAccount,
  useStakingRewardAccount,
} from "./lib/useQueries";
import { useWalletContext } from "./providers/WalletContextProvider";
import { useConnectionContext } from "./providers/ConnectionContextProvider";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { Button } from "@effectai/ui";
import { AppHeader } from "./components/AppHeader";

function App() {
  const { address, signer } = useWalletContext();
  const { connection } = useConnectionContext();

  const {
    data: stakeAccount,
    isLoading,
    isFetching,
    isError,
  } = useStakeAccount(connection, address);

  const { data: rewardAccount } = useStakingRewardAccount(
    connection,
    stakeAccount,
  );

  const { data: vestingAccount } = useRewardVestingAccount(connection);
  const { data: reflectionAccount } = useReflectionAccount(connection);

  return (
    <AppShell>
      <>
        <AppHeader />
        <div className="mx-auto mt-20 max-w-3xl px-4">
          {!address && (
            <div className="text-center">
              <p className="mb-4">Connect your wallet to get started</p>
            </div>
          )}
          {address && (
            <Tabs defaultValue="overview" className="">
              <TabsList className="mb-4 flex flex-wrap items-center gap-2 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stake">Stake</TabsTrigger>
                <TabsTrigger value="unstake">Unstake</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div>
                  <StakeOverview
                    vestingAccount={vestingAccount}
                    reflectionAccount={reflectionAccount}
                    stakeAccount={stakeAccount}
                    rewardAccount={rewardAccount}
                    isLoading={isLoading || isFetching}
                  />
                </div>
              </TabsContent>
              <TabsContent value="stake">
                <StakeForm stakeAccount={stakeAccount} signer={signer} />
              </TabsContent>
              <TabsContent value="unstake">
                <UnstakeForm stakeAccount={stakeAccount} signer={signer} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </>
    </AppShell>
  );
}

export default App;
