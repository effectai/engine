import AppShell from "./components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StakeForm } from "./components/StakingForm";
import { StakeOverview } from "./components/StakingOverview";
import { useCallback, useEffect, useState } from "react";
import { useSolanaContext, type Balance } from "./providers/SolanaProvider";
import {
  getBase64Encoder,
  address as toAddress,
  type Account,
} from "@solana/kit";
import {
  fetchStakingAccountsByWalletAddress,
  decodeStakeAccount,
  EFFECT_STAKING_PROGRAM_ADDRESS,
  type StakeAccount,
} from "@effectai/stake";
import { useWalletAccountTransactionSigner } from "@solana/react";
import { UnstakeForm } from "./components/UnstakeForm";
import { deriveRewardAccountsPda } from "@effectai/reward";
import { EFFECT } from "./lib/useEffectConfig";

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

  const [stakeAccount, setStakeAccount] =
    useState<Account<StakeAccount> | null>(null);

  useEffect(() => {
    if (address && connection) {
      fetchStakingAccountsByWalletAddress({
        walletAddress: address,
        rpc: connection.rpc,
      }).then(([account]) => {
        const acc = decodeStakeAccount({
          executable: account.account.executable,
          space: account.account.space,
          lamports: account.account.lamports,
          programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
          data: getBase64Encoder().encode(
            (account.account.data as unknown as [string, string])[0],
          ),
          address: toAddress(account.pubkey),
        });
        setStakeAccount(acc);
      });
    }
  }, [address, connection]);

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
              <StakeOverview stakeAccount={stakeAccount} />
            </div>
          </TabsContent>
          <TabsContent value="stake">
            <StakeForm
              stakeAccount={stakeAccount}
              signer={signer}
              availableBalance={availableBalance}
            />
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
