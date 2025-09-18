import type { SourceChain } from "@/lib/wallet-types";
import { useMigration } from "@/providers/MigrationProvider";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@effectai/react";
import { CheckCircle2, Loader2 } from "lucide-react";

import bscIcon from "@/assets/bsc.svg";
import eosIcon from "@/assets/eos.svg";
const CHAINS: Record<
  SourceChain,
  { label: string; icon: string; variant?: "default" | "outline" }
> = {
  BSC: { label: "BSC", icon: bscIcon, variant: "default" },
  EOS: { label: "EOS", icon: eosIcon, variant: "outline" },
};

export function ConnectSourceWalletForm() {
  const { sourceChain, setSourceChain, source } = useMigration();
  const [pendingChain, setPendingChain] = useState<SourceChain | null>(null);

  const isConnected = source.isConnected;
  const connectedChain = source.walletMeta?.chain ?? null;

  // Try to connect automatically after user selects a chain
  useEffect(() => {
    if (!pendingChain) return;
    if (sourceChain !== pendingChain) return;
    if (isConnected) {
      setPendingChain(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        await Promise.resolve(source.connect());
      } finally {
        if (!cancelled) setPendingChain(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pendingChain, sourceChain, isConnected, source]);

  const onPickChain = (chain: SourceChain) => {
    setPendingChain(chain);
    setSourceChain(chain);
  };

  const statusText = useMemo(() => {
    if (isConnected) {
      return (
        <>
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Connected to <b>{connectedChain ?? "wallet"}</b>.
        </>
      );
    }
    if (pendingChain) {
      return (
        <>
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          Connecting to <b>{pendingChain}</b>…
        </>
      );
    }
    return <>Choose a source wallet to connect.</>;
  }, [isConnected, connectedChain, pendingChain]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm inline-flex items-center text-muted-foreground">
        {statusText}
      </div>

      {!isConnected && (
        <div className="flex items-center gap-2">
          {(Object.keys(CHAINS) as SourceChain[]).map((id) => {
            const cfg = CHAINS[id];
            const isSelected = sourceChain === id;
            const isPending = pendingChain === id;

            return (
              <Button
                key={id}
                variant={cfg.variant ?? "default"}
                onClick={() => onPickChain(id)}
                className="flex items-center gap-2"
                disabled={isPending}
                aria-pressed={isSelected}
                title={`Connect ${cfg.label} wallet`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <img
                    src={cfg.icon}
                    alt={`${cfg.label} logo`}
                    className="h-4 w-4"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {cfg.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
