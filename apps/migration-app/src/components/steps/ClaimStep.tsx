import * as React from "react";
import { Button } from "@effectai/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@effectai/ui";
import { Alert, AlertDescription, AlertTitle } from "@effectai/ui";
import { Input } from "@effectai/ui";
import { Badge } from "@effectai/ui";
import {
  Wallet,
  Link as LinkIcon,
  Share2,
  Copy,
  PlugZap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import ClaimCard from "../ClaimCard";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { BlockchainAddress } from "../BlockchainAddress";

type Props = {
  current: "claim" | string;
  source: { address?: string | null };
  migrationAccount: any | null;
  disconnectSourceWallets: () => void | Promise<void>;

  // mobile fallback
  isMobile: boolean;
  hasSolanaWalletInstalled: boolean;
  authorizeUrl: string;
  shareAuthorize: () => void;
  copyAuthorize: () => void;

  // solana connect state
  solanaWalletAddress: string | null;
  UnifiedWalletButton: React.ComponentType;

  // claim data
  foreignPublicKey?: Uint8Array | null;
  signature?: string | Uint8Array | null;
  message?: string | Uint8Array | null;
  migrationVaultBalance: number | null | undefined;
  claim: (args: any) => Promise<void> | void;
};

export function ClaimStep({
  current,
  source,
  migrationAccount,
  disconnectSourceWallets,
  isMobile,
  hasSolanaWalletInstalled,
  authorizeUrl,
  shareAuthorize,
  copyAuthorize,
  solanaWalletAddress,
  foreignPublicKey,
  signature,
  message,
  migrationVaultBalance,
  claim,
}: Props) {
  if (current !== "claim") return null;

  const showNoClaims = !migrationAccount;

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
        {showNoClaims ? (
          <>
            {source.address && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Source account:&nbsp;
                </span>
                <BlockchainAddress address={String(source.address)} />
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
              <Button variant="outline" onClick={disconnectSourceWallets}>
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
                    <Input readOnly value={authorizeUrl} />
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
            ) : !solanaWalletAddress ? (
              // Prompt to connect Solana wallet
              <div className="rounded-xl border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground mb-3">
                  Connect a Solana wallet to receive your tokens.
                </p>
                <UnifiedWalletButton />
              </div>
            ) : (
              // Ready to claim
              <>
                {foreignPublicKey &&
                  migrationAccount &&
                  signature &&
                  message && (
                    <ClaimCard
                      migrationAccount={migrationAccount}
                      message={message}
                      foreignPublicKey={foreignPublicKey}
                      signature={signature}
                      migrationVaultBalance={migrationVaultBalance}
                      claim={claim}
                    />
                  )}

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Almost there</AlertTitle>
                  <AlertDescription>
                    Review the claim details and submit the transaction on
                    Solana. Keep a small amount of SOL for fees.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
