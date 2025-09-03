import { Button } from "@effectai/ui";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@effectai/ui";
import { Alert, AlertDescription, AlertTitle } from "@effectai/ui";
import { Badge } from "@effectai/ui";
import {
  Info,
  ShieldAlert,
  Wallet,
  ArrowRight,
  Power,
  ArrowLeft,
} from "lucide-react";
import { WalletCard } from "../WalletCard";
import { ConnectSourceWalletForm } from "../ConnectSourceWalletForm";
import type { SourceWallet } from "@/lib/wallet-types";

export function AuthenticateStep({
  current,
  foreignPublicKey,
  snapshotDate,
  source,
  nativeBalance,
  efxBalance,
  migrationAccount,
  goTo,
  disconnectSourceWallets,
}: {
  current: "authenticate" | string;
  foreignPublicKey: Uint8Array | null;
  snapshotDate: Date;
  source: SourceWallet;
  nativeBalance?: { value: number; symbol: string } | null;
  efxBalance?: { value: number; symbol: string } | null;
  migrationAccount?: unknown | null;
  goTo: (k: string) => void;
  disconnectSourceWallets: () => void | Promise<void>;
}) {
  if (current !== "authenticate") return null;

  const snapshot = snapshotDate.toLocaleString();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connect Source Wallet
            </CardTitle>
            <CardDescription className="mt-2">
              Prove ownership of your BSC or EOS account from the snapshot.
            </CardDescription>
          </div>

          <Badge variant="secondary" className="whitespace-nowrap">
            Snapshot: {snapshot}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {!foreignPublicKey ? (
          <>
            {!source.isConnected ? (
              <div className="rounded-xl bg-muted/30 p-5">
                <ConnectSourceWalletForm />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {source.address && (
                  <WalletCard
                    address={String(source.address)}
                    chainLabel={source.walletMeta?.chain ?? "Source"}
                    onDisconnect={disconnectSourceWallets}
                    nativeBalance={nativeBalance}
                    efxBalance={efxBalance}
                  />
                )}

                <div className="flex items-center justify-center gap-2 w-full">
                  <Button onClick={() => goTo("solana")} className="group">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Connected + preverified view */}
            <div className="flex flex-col items-center gap-4">
              {source.isConnected && source.address && (
                <WalletCard
                  address={String(source.address)}
                  chainLabel={source.walletMeta?.chain ?? "Source"}
                  onDisconnect={disconnectSourceWallets}
                  nativeBalance={nativeBalance}
                  efxBalance={efxBalance}
                />
              )}

              {!migrationAccount && (
                <Alert variant="destructive" className="max-w-lg">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>No active claims</AlertTitle>
                  <AlertDescription>
                    We couldn’t find any EFX holdings or stake for this account
                    at the snapshot. Double-check you’re using the correct
                    account (and chain).
                  </AlertDescription>
                </Alert>
              )}

              {source.walletMeta?.chain === "EOS" && (
                <Alert className="max-w-lg">
                  <Info className="h-4 w-4" />
                  <AlertTitle>EOS permission tip</AlertTitle>
                  <AlertDescription className="text-sm">
                    Most accounts should use the <b>active</b> permission. If
                    your active key is an
                    <b> R1</b> key or you’re using a multisig, use your{" "}
                    <b>owner</b> permission.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={disconnectSourceWallets}
                variant="outline"
                className="mt-2"
              >
                <Power className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
