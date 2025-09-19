export function SolanaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path
        d="M54 176c2-3 5-5 9-5h153c8 0 12 10 6 16l-36 34c-2 3-5 5-9 5H24c-8 0-12-10-6-16l36-34Z"
        fill="url(#g1)"
      />
      <path
        d="M54 30c2-3 5-5 9-5h153c8 0 12 10 6 16l-36 34c-2 3-5 5-9 5H24c-8 0-12-10-6-16L54 30Z"
        fill="url(#g2)"
      />
      <path
        d="M54 103c2-3 5-5 9-5h153c8 0 12 10 6 16l-36 34c-2 3-5 5-9 5H24c-8 0-12-10-6-16l36-34Z"
        fill="url(#g1)"
      />
    </svg>
  );
}

import EffectCoinImg from "@/assets/img/effect-coin.jpg";
import { cn } from "@/lib/utils";
export function EffectCoin({ className }: { className?: string }) {
  return (
    <img
      src={EffectCoinImg}
      alt="Effect Coin"
      className={cn("h-4 w-4 rounded-full", className)}
    />
  );
}
