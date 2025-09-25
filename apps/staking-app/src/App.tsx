import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  AppHeader,
  Toaster,
  Skeleton,
  useWalletContext,
  useConnectionContext,
} from "@effectai/react";
import { ConnectWalletEmptyState } from "./components/ConnectWalletEmptyState";
import { StakeForm } from "./components/StakingForm";
import { StakeOverview } from "./components/StakingOverview";
import { UnstakeForm } from "./components/UnstakeForm";
import {
  useReflectionAccount,
  useRewardVestingAccount,
  useStakeAccount,
  useStakingRewardAccount,
} from "./lib/useQueries";

function App() {
  const { address, signer } = useWalletContext();
  const { connection } = useConnectionContext();

  const {
    data: stakeAccount,
    isLoading,
    isFetching,
  } = useStakeAccount(connection, address);

  const { data: rewardAccount } = useStakingRewardAccount(
    connection,
    stakeAccount,
  );

  const { data: vestingAccount } = useRewardVestingAccount(connection);
  const { data: reflectionAccount } = useReflectionAccount(connection);

  return (
    <div className="grid">
      <main className="flex flex-col">
        <div className="container mx-auto w-full max-w-6xl p-4">
          <AppHeader />
          <div className="mx-auto mt-20 max-w-3xl px-4">
            {!address && <ConnectWalletEmptyState />}
            {address && signer && (
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
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
