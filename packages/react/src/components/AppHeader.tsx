import { cn } from "@/lib/utils";
import { LogIn } from "lucide-react";
import {
  Logo,
  TokenBalanceBadge,
  SolanaMark,
  EffectCoin,
} from "@effectai/react";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { useWalletContext } from "@/providers/WalletContextProvider";
import { Button } from "./ui/button";

export function AppHeader() {
  const { effectBalance, lamports } = useWalletContext();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "backdrop-blur-md bg-background/60 border-b border-border/40",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo className="w-full" />
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://jup.ag/swap?sell=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&buy=EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E"
            target="_blank"
            rel="noreferrer"
          >
            <TokenBalanceBadge
              className="text-xs"
              ticker="EFFECT"
              icon={<EffectCoin />}
              balance={effectBalance?.uiAmount.toFixed(2) ?? 0}
              isLoading={false}
            />
          </a>
          <TokenBalanceBadge
            className="text-xs"
            ticker="SOL"
            icon={<SolanaMark />}
            balance={(lamports ?? 0n) / BigInt(1e9)}
            isLoading={false}
          />
        </div>

        <nav className="flex items-center gap-2">
          {/* <Button variant="ghost" size="sm" className="flex items-center gap-1"> */}
          {/*    <ExternalLink className="h-4 w-4" /> */}
          {/*     Portal */}
          {/*   </Button> */}
          <UnifiedWalletButton
            overrideContent={
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1"
              >
                <LogIn className="h-4 w-4" />
                Connect
              </Button>
            }
          />
        </nav>
      </div>
    </header>
  );
}
