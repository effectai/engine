import { useMemo } from "react";

export function BlockchainAddress({ address }: { address: string }) {
  const short = useMemo(
    () =>
      address.length > 12
        ? `${address.slice(0, 6)}…${address.slice(-6)}`
        : address,
    [address],
  );
  return (
    <code className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
      {short}
    </code>
  );
}
