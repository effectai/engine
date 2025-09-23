import type { SourceChain, SourceWallet } from "@/lib/wallet-types";
import { useEffect } from "react";
import { Button } from "@effectai/react";
import { Loader2 } from "lucide-react";

import bscIcon from "@/assets/bsc.svg";
import eosIcon from "@/assets/eos.svg";
import { useMutation } from "@tanstack/react-query";

const CHAINS: Record<
  SourceChain,
  { label: string; icon: string; variant?: "default" | "outline" }
> = {
  BSC: { label: "BSC", icon: bscIcon, variant: "default" },
  EOS: { label: "EOS", icon: eosIcon, variant: "outline" },
};

type Props = {
  sourceChain: SourceChain | null;
  setSourceChain: (c: SourceChain) => void;
  sourceWallet: SourceWallet | null;
};

export function ConnectSourceWalletForm({
  sourceChain,
  setSourceChain,
  sourceWallet,
}: Props) {
  const { mutateAsync: connectSourceWallet, isPending } = useMutation({
    mutationKey: ["connect-source-wallet"],
    mutationFn: async () => {
      if (!sourceWallet) throw new Error("No source wallet");
      await sourceWallet.connect();
    },
  });

  const chooseChain = (c: SourceChain) => {
    setSourceChain(c);
  };

  useEffect(() => {
    let cancelled = false;
    if (!sourceChain) return;

    (async () => {
      try {
        console.log("Connecting to source wallet for chain:", sourceChain);
        await connectSourceWallet();
        if (cancelled) return;
      } catch (e) {
        console.warn("Failed to connect source wallet:", e);
      } finally {
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceChain, connectSourceWallet]);

  return (
    <div className="flex flex-col gap-3">
      {
        <div className="flex items-center gap-2">
          {(Object.keys(CHAINS) as SourceChain[]).map((id) => {
            const cfg = CHAINS[id];
            const isSelected = sourceChain === id;

            return (
              <Button
                key={id}
                variant={cfg.variant ?? "default"}
                onClick={() => chooseChain(id)}
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
      }
    </div>
  );
}
