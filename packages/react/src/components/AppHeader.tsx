import { cn } from "@/lib/utils";
import { ExternalLink, LogIn } from "lucide-react";
import { Logo } from "./Logo";
import { TokenBalanceBadge } from "./TokenBadge";
import { SolanaMark, EffectCoin } from "./Icons";
import {
  UnifiedWalletButton,
  useUnifiedWalletContext,
  useWallet,
} from "@jup-ag/wallet-adapter";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { shorten } from "@/lib/utils";

import { useWalletContext } from "@/providers/WalletContextProvider";

export function AppHeader() {
  const { lamports, effectBalance } = useWalletContext();

  const lamportBalance = lamports ? Number(lamports) : 0;
  const tokenBalance = effectBalance ? Number(effectBalance.uiAmount) : 0;
  const { address } = useWalletContext();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "backdrop-blur-md bg-background/60 border-b border-border/40",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <a href="/">
            <Logo className="w-full" />
          </a>
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          <a
            href="https://jup.ag/swap?sell=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&buy=EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E"
            target="_blank"
            rel="noreferrer"
          >
            <TokenBalanceBadge
              className="text-xs"
              ticker="EFFECT"
              icon={<EffectCoin />}
              balance={tokenBalance}
              isLoading={false}
            />
          </a>
          <TokenBalanceBadge
            className="text-xs"
            ticker="SOL"
            icon={<SolanaMark />}
            balance={lamportBalance / 1e9}
            isLoading={false}
          />
        </div>

        <nav className="flex items-center gap-2">
          {!address ? (
            <UnifiedWalletButton
              overrideContent={
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <LogIn className="h-4 w-4" /> Connect{" "}
                </Button>
              }
            />
          ) : (
            <ProfileMenu />
          )}
        </nav>
      </div>
    </header>
  );
}

export function ProfileMenu() {
  const { wallet, disconnect } = useWallet();
  const { address } = useWalletContext();

  return (
    wallet &&
    address && (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar>
              <AvatarImage src={wallet.adapter.icon} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>

            <span className="text-sm">{shorten(address)}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem className="text-red-500" onClick={disconnect}>
            Disconnect
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Apps</DropdownMenuLabel>
          <DropdownMenuItem>
            <a
              href="https://staking.effect.ai"
              className="w-full flex justify-between items-center"
              rel="noreferrer"
            >
              Staking
              <ExternalLink />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <a
              href="https://worker.effect.ai"
              className="w-full flex justify-between items-center"
              rel="noreferrer"
            >
              Worker
              <ExternalLink />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <a
              href="https://migrate.effect.ai"
              className="w-full flex justify-between items-center"
              rel="noreferrer"
            >
              Migration
              <ExternalLink />
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
}
