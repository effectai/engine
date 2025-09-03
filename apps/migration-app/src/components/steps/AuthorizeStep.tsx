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
import { Separator } from "@effectai/ui";
import { Badge } from "@effectai/ui";
import { BlockchainAddress } from "../BlockchainAddress";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@effectai/ui";

import {
  ShieldCheck,
  Shield,
  KeyRound,
  Copy,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

type Props = {
  current: "authorize" | string;
  sourceAddress: string;
  foreignPublicKey: Uint8Array | null;
  signature?: string | Uint8Array | null;
  message?: string | Uint8Array | null;
  authorize: () => Promise<void> | void;
  goTo: (k: string) => void;
};

function previewBytes(value?: string | Uint8Array | null, max = 18) {
  if (!value) return "—";
  const s =
    typeof value === "string" ? value : Buffer.from(value).toString("hex");
  if (s.length <= max) return s;
  return `${s.slice(0, Math.ceil((max - 1) / 2))}…${s.slice(-Math.floor((max - 1) / 2))}`;
}

export function AuthorizeStep({
  current,
  foreignPublicKey,
  signature,
  message,
  authorize,
  goTo,
  sourceAddress,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  if (current !== "authorize") return null;

  const authorized = Boolean(signature && message && foreignPublicKey);
  const onAuthorize = async () => {
    setErr(null);
    try {
      setLoading(true);
      await Promise.resolve(authorize());
    } catch (e: any) {
      setErr(e?.message ?? "Authorization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {authorized ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
              {authorized ? "Authorized" : "Authorize migration"}
            </CardTitle>
            <CardDescription>
              {authorized
                ? "Your ownership has been verified. You can proceed to claim."
                : "Sign a message to authorize migrating your EFX to Solana."}
            </CardDescription>
          </div>
          <Badge
            variant={authorized ? "secondary" : "outline"}
            className="whitespace-nowrap"
          >
            {authorized ? "Ready" : "Signature required"}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 space-y-4">
        {!authorized && (
          <Alert>
            <KeyRound className="h-4 w-4" />
            <AlertTitle>Why do I need to sign?</AlertTitle>
            <AlertDescription>
              The signature proves you control the source account. It doesn’t
              move funds and won’t incur fees.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl border bg-muted/30 p-4">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Source account</dt>
              <dd className="mt-0.5 font-mono break-all">
                <BlockchainAddress address={sourceAddress} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Message</dt>
              <dd className="mt-0.5 font-mono">{previewBytes(message)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Signature</dt>
              <dd className="mt-0.5 font-mono">{previewBytes(signature)}</dd>
            </div>
          </dl>

          {/* Copy row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!!message && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          typeof message === "string"
                            ? message
                            : Buffer.from(message).toString("hex"),
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy message
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy the raw message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!!signature && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          typeof signature === "string"
                            ? signature
                            : Buffer.from(signature).toString("hex"),
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy signature
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy the signature</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertTitle>Authorization error</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex w-full items-center justify-between gap-3">
        {!authorized ? (
          <Button onClick={onAuthorize} disabled={loading} className="group">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authorizing…
              </>
            ) : (
              <>
                Authorize
                <KeyRound className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <div className="inline-flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Authorization complete
          </div>
        )}

        <Button
          onClick={() => goTo("claim")}
          disabled={!authorized}
          className="group"
        >
          Continue to Claim
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
