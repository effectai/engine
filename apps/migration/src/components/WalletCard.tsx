import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Copy, Loader2, PlugZap } from "lucide-react";

type Balance = { value: number; symbol: string } | null | undefined;

type WalletCardProps = {
  address: string;
  chainLabel: string;
  onDisconnect: () => void | Promise<void>;
  nativeBalance?: Balance;
  efxBalance?: Balance;
  /** Optional explorer base URL, e.g. "https://bscscan.com/address" */
  explorerBaseUrl?: string;
};

function shorten(addr: string, head = 6, tail = 4) {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function fmtBalance(bal: Balance, maxFrac = 6) {
  if (bal == null) return "—";
  const { value, symbol } = bal;
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: maxFrac,
  })} ${symbol}`;
}

export function WalletCard({
  address,
  chainLabel,
  onDisconnect,
  nativeBalance,
  efxBalance,
  explorerBaseUrl,
}: WalletCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const explorerUrl = useMemo(() => {
    if (!explorerBaseUrl) return null;
    try {
      // Allow passing either full URL with or without trailing slash
      return `${explorerBaseUrl.replace(/\/+$/, "")}/${address}`;
    } catch {
      return null;
    }
  }, [explorerBaseUrl, address]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className="w-full mx-auto shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              {chainLabel}
            </Badge>

            <span className="text-sm font-mono truncate max-w-[220px] sm:max-w-[320px]">
              {shorten(address)}
            </span>

            <div className="flex items-center gap-1 ml-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigator.clipboard?.writeText(address)}
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </Button>

              {explorerUrl && (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="View on explorer"
                >
                  <a href={explorerUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting…
              </>
            ) : (
              <>
                <PlugZap className="mr-2 h-4 w-4" />
                Disconnect
              </>
            )}
          </Button>
        </div>

        <CardTitle className="sr-only">{chainLabel} Wallet</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="opacity-70">Native</div>
            <div className="font-mono mt-0.5">{fmtBalance(nativeBalance)}</div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="opacity-70">EFX</div>
            <div className="font-mono mt-0.5">{fmtBalance(efxBalance)}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <p className="text-xs text-muted-foreground"></p>
      </CardFooter>
    </Card>
  );
}
