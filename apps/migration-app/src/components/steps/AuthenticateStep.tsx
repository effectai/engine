import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  useProfileContext,
  useConnectionContext,
} from "@effectai/react";

import { useMigration } from "@/providers/MigrationProvider";

import { Info, ShieldAlert, ArrowRight, WalletIcon } from "lucide-react";
import { WalletCard } from "../WalletCard";
import { ConnectSourceWalletForm } from "../ConnectSourceWalletForm";
import { SNAPSHOT_DATE } from "@/consts";
import { useMigrationStore } from "@/stores/migrationStore";
import { useGetSourceNativeBalanceQuery } from "@/hooks/useGetSourceNativeBalanceQuery";
import { useGetSourceEfxBalanceQuery } from "@/hooks/useGetSourceEfxBalanceQuery";
import { useGetMigrationAccountQuery } from "@/hooks/useGetMigrationAccountQuery";
import { useEffect } from "react";

export function AuthenticateStep() {
  const snapshot = SNAPSHOT_DATE.toLocaleString();

  const { disconnect, migrationAddress, goTo } = useMigrationStore();
  const { sourceWallet, setSourceChain, sourceChain } = useMigration();

  const setForeignPublicKey = useMigrationStore((s) => s.setForeignPublicKey);
  const { mint } = useProfileContext();

  useEffect(() => {
    const runner = async () => {
      const foreignKey = await sourceWallet?.getForeignPublicKey();

      if (foreignKey) {
        setForeignPublicKey(foreignKey, mint);
      }

      return;
    };

    runner();
  }, [mint, setForeignPublicKey, sourceWallet?.address]);

  const onDisconnect = () => {
    sourceWallet?.disconnect();
    setSourceChain(null);
    disconnect();
  };

  const connected = Boolean(sourceWallet?.isConnected && sourceWallet?.address);

  const { data: nativeBalance } = useGetSourceNativeBalanceQuery(sourceWallet);
  const { data: efxBalance } = useGetSourceEfxBalanceQuery(sourceWallet);

  const { connection } = useConnectionContext();

  const { data: migrationAccount, isLoading: isLoadingMigration } =
    useGetMigrationAccountQuery(connection, migrationAddress);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Connect Source Wallet
            </CardTitle>
            <CardDescription className="mt-2">
              Prove ownership of your BSC or EOS account from the snapshot.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">
            Snapshot: {new Date(snapshot).toLocaleString()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 1) Not connected → Connect UI */}
        {!connected ? (
          <div className="rounded-xl bg-muted/30 p-5">
            <ConnectSourceWalletForm
              sourceChain={sourceChain}
              setSourceChain={setSourceChain}
              sourceWallet={sourceWallet}
            />
          </div>
        ) : (
          /* 2) Connected → Wallet card + next/alerts */
          <div className="flex flex-col items-center gap-4">
            <WalletCard
              address={String(sourceWallet.address)}
              chainLabel={sourceWallet.walletMeta?.chain ?? "Source"}
              onDisconnect={onDisconnect}
              nativeBalance={nativeBalance}
              efxBalance={efxBalance}
            />

            {/* 2a) If migration account exists → show Continue */}
            {migrationAccount && migrationAccount.exists ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <Button onClick={() => goTo("solana")} className="group">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            ) : (
              /* 2b) If not found → show alerts (chain specific + no-claim) */
              <>
                {!isLoadingMigration && (
                  <Alert variant="destructive" className="max-w-lg">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>No active claims</AlertTitle>
                    <AlertDescription>
                      We couldn’t find any active claims for EFX holdings for
                      this account at the snapshot. Double-check if you've
                      already claimed and you’re using the correct account (and
                      chain).
                    </AlertDescription>
                  </Alert>
                )}

                {sourceChain === "EOS" && (
                  <Alert className="max-w-lg">
                    <Info className="h-4 w-4" />
                    <AlertTitle>EOS permission tip</AlertTitle>
                    <AlertDescription className="text-sm">
                      Most accounts should use the active permission. If your
                      active key is an R1 key or you’re using a multisig, use
                      your owner permission.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
