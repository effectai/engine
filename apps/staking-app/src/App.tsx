import AppShell from "./components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StakeForm } from "./components/StakingForm";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { StakingOverview } from "./components/StakingOverview";
import { useEffect, useState } from "react";
import { useSolanaWallet } from "./hooks/useSolanaWallet";
import { useSolanaContext } from "./providers/SolanaProvider";

function App() {
  const { getEffectBalance, address } = useSolanaContext();

  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  useEffect(() => {
    if (address) {
      getEffectBalance(address).then((balance) => {
        setAvailableBalance(balance);
      });
    } else {
      setAvailableBalance(null);
    }
  }, [address, getEffectBalance]);

  return (
    <AppShell>
      <UnifiedWalletButton />
      <Tabs defaultValue="account" className="w-[600px]">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div>
            <StakingOverview />
          </div>
        </TabsContent>
        <TabsContent value="stake">
          <StakeForm availableBalance={availableBalance} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

export default App;
