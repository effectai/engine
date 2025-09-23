import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Alert,
  AlertDescription,
  AlertTitle,
  Input,
  Badge,
  useWalletContext,
} from "@effectai/react";
import { Wallet, Share2, Copy, PlugZap, AlertTriangle } from "lucide-react";
import ClaimCard from "../ClaimCard";
import { BlockchainAddress } from "../BlockchainAddress";
import { useGetMigrationAccountVaultBalanceQuery } from "../../hooks/useGetMigrationAccountQuery";
import { useGetMigrationAccountQuery } from "@/hooks/useGetMigrationAccountQuery";
import { useConnectionContext } from "@effectai/react";
import { useMigrationStore } from "@/stores/migrationStore";

export function ClaimStep() {
  const { connection } = useConnectionContext();

  const migrationAccountAddress = useMigrationStore((s) => s.migrationAddress);
  const authorizeUrl = useMigrationStore((s) => s.authorizeUrl);

  const foreignPublicKey = useMigrationStore((s) => s.foreignPublicKey);
  const signature = useMigrationStore((s) => s.signature);
  const message = useMigrationStore((s) => s.message);

  const copyAuthorize = React.useCallback(() => {
    const url = authorizeUrl();
    navigator.clipboard.writeText(url);
  }, [authorizeUrl]);

  const shareAuthorize = React.useCallback(() => {
    const url = authorizeUrl();
    if ("share" in navigator) {
      navigator.share({
        title: "Claim your EFFECT tokens",
        text: "Complete your token migration by claiming your EFFECT tokens on Solana.",
        url,
      });
    }
  }, [authorizeUrl]);

  const disconnect = useMigrationStore((s) => s.disconnect);
  const { address } = useWalletContext();

  const hasSolanaWalletInstalled = React.useMemo(
    () => typeof window !== "undefined" && !!(window as any).solana,
    [],
  );

  const isMobile = React.useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Mobi|Android/i.test(navigator.userAgent);
  }, []);

  const { data: migrationAccount } = useGetMigrationAccountQuery(
    connection,
    migrationAccountAddress,
  );

  const { data: vaultBalance } = useGetMigrationAccountVaultBalanceQuery(
    connection,
    migrationAccountAddress,
  );

  const openWalletModal = () => {
    const btn = document.querySelector('[data-slot="button"]') as HTMLElement;
    if (btn) {
      btn.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Claim EFFECT on Solana
            </CardTitle>
            <CardDescription>
              Finalize your migration by claiming to your Solana address.
            </CardDescription>
          </div>
          {migrationAccount ? (
            <Badge variant="secondary">Eligible</Badge>
          ) : (
            <Badge variant="outline">No claim</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {!migrationAccount ? (
          <>
            {foreignPublicKey && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Source account:&nbsp;
                </span>
                <BlockchainAddress address={String(foreignPublicKey)} />
              </div>
            )}

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No active claims found</AlertTitle>
              <AlertDescription>
                We couldn’t find eligible EFX balance or stake for this account
                at the snapshot. Try another account or chain.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={disconnect}>
                <PlugZap className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Mobile fallback if no Solana wallet support */}
            {isMobile && !hasSolanaWalletInstalled ? (
              <Card className="w-full border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Auth complete on mobile 🎉
                  </CardTitle>
                  <CardDescription>
                    Open this link on a desktop browser or an in-app browser of
                    a Solana wallet to continue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input readOnly value={authorizeUrl()} />
                    <Button variant="outline" onClick={copyAuthorize}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    {"share" in navigator && (
                      <Button variant="outline" onClick={shareAuthorize}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : !address ? (
              // Prompt to connect Solana wallet
              <div className="rounded-xl border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground mb-3">
                  Connect a Solana wallet to receive your tokens.
                </p>
                <Button onClick={openWalletModal}> Connect Wallet </Button>
              </div>
            ) : (
              // Ready to claim
              <>
                {foreignPublicKey &&
                  migrationAccount &&
                  signature &&
                  message && (
                    <ClaimCard
                      migrationVaultBalance={vaultBalance?.uiAmount ?? null}
                      migrationAccount={migrationAccount}
                      message={message}
                      foreignPublicKey={foreignPublicKey}
                      signature={signature}
                    />
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
