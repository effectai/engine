import { cn } from "@/lib/utils";
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function formatNumber(n: number, maxFrac = 6) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
}

export function formatPercent(n: number, maxFrac = 2) {
  if (!isFinite(n)) return "0%";
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  })}%`;
}

export function trimTrailingZeros(n: number) {
  const s = n.toFixed(9);
  return s.replace(/\.?0+$/, "");
}

export function shorten(addr: string, head = 6, tail = 4) {
  return addr.length <= head + tail + 1
    ? addr
    : `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function Stat({
  icon,
  label,
  value,
  emphasis = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold",
          emphasis && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
