import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReloadIcon } from "@radix-ui/react-icons";

export function TokenBalanceBadge({
  icon,
  ticker,
  balance,
  isLoading = false,
  onRefresh,
  className,
  decimals = 4,
}: {
  icon: React.ReactNode;
  balance?: number | null;
  ticker?: string;
  isLoading?: boolean;
  onRefresh?: () => void | Promise<void>;
  className?: string;
  decimals?: number;
}) {
  const content =
    balance == null
      ? "—"
      : balance.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        });

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-background/60",
        "backdrop-blur supports-[backdrop-filter]:bg-background/40",
        "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <span className="flex h-4 w-4">{icon}</span>

      <span className="font-medium tabular-nums">
        {isLoading ? "…" : content}
      </span>

      {ticker && (
        <span className="text-xs text-muted-foreground">{ticker}</span>
      )}

      {onRefresh && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1"
                onClick={() => onRefresh()}
                disabled={isLoading}
                aria-label="Refresh SOL balance"
              >
                <ReloadIcon
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Refresh</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/** Minimal Solana logo (inline SVG) */
