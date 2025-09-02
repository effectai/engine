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

function App() {
  const { getEffectBalance, address, connection, uiAccount } =
    useSolanaContext();

  const signer = useWalletAccountTransactionSigner(uiAccount, "solana:mainnet");

  const [availableBalance, setAvailableBalance] = useState<Balance | null>(
    null,
  );
  useEffect(() => {
    if (address) {
      getEffectBalance(address).then((balance) => {
        setAvailableBalance(balance);
      });
    } else {
      setAvailableBalance(null);
    }
  }, [address, getEffectBalance]);

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
      {uiAccount && address && (
        <Tabs defaultValue="account" className="w-[600px]">
          <TabsList>
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
          {stakeAccount && (
            <TabsContent value="unstake">
              <UnstakeForm stakeAccount={stakeAccount} signer={signer} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </AppShell>
  );
}

export default App;
