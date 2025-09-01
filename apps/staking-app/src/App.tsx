import AppShell from "./components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StakeForm } from "./components/StakingForm";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

function App() {
  return (
    <AppShell>
      <UnifiedWalletButton />
      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div>Overview content goes here.</div>
        </TabsContent>
        <TabsContent value="stake">
          <StakeForm />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

export default App;
