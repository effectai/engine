import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@effectai/ui";
import { Button } from "@effectai/ui";
import { Badge } from "@effectai/ui";
import { Info, CheckCircle2, Clock, Check } from "lucide-react";
import type {
  fetchMaybeMigrationAccount,
  MigrationAccount,
} from "@effectai/migration";
import { useMigration } from "@/providers/MigrationProvider";
import { useWalletAccountTransactionSigner } from "@solana/react";

type Props = {
  migrationVaultBalance: number | null;
  migrationAccount: Awaited<ReturnType<typeof fetchMaybeMigrationAccount>>;
  foreignPublicKey: Uint8Array;
  message: string | Uint8Array;
  signature: string | Uint8Array;
  claim: (args: {
    signer: unknown;
    migrationAccount: MigrationAccount;
    foreignPublicKey: string;
    message: Props["message"];
    signature: Props["signature"];
  }) => Promise<void> | void;
  className?: string;
};

export default function ClaimCard(props: Props) {
  const [submitting, setSubmitting] = useState(false);
  const balance = props.migrationVaultBalance ?? 0;
  const { sol, claim } = useMigration();
  const signer = useWalletAccountTransactionSigner(
    sol.uiWalletEntry.uiAccount,
    "solana:mainnet",
  );

  const formattedBalance = useMemo(
    () =>
      balance.toLocaleString(undefined, {
        maximumFractionDigits: 6,
      }),
    [balance],
  );

  const stakedSince = useMemo(() => {
    if (!props.migrationAccount.exists) return null;
    // stakeStartTime assumed seconds; convert to ms
    const d = new Date(
      Number(props.migrationAccount.data.stakeStartTime) * 1000,
    );
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [props.migrationAccount]);

  const canClaim = balance > 0 && !submitting;

  const onClaim = async () => {
    try {
      setSubmitting(true);
      await props.claim({
        signer,
        migrationAccount: props.migrationAccount,
        foreignPublicKey: props.foreignPublicKey,
        message: props.message,
        signature: props.signature,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={props.className}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          Ready to claim your <span className="font-bold">EFFECT</span> tokens
          {balance > 0 ? (
            <Badge className="ml-2 bg-accent text-black">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">
              <Info className="mr-1 h-4 w-4" />
              No balance
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Claim your new EFFECT tokens on Solana using your verified signature.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/50 p-4">
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div className="col-span-1">
              <dt className="text-muted-foreground">Migration vault</dt>
              <dd className="mt-0.5 font-medium">
                {props.migrationVaultBalance === null ? (
                  <span className="italic text-muted-foreground">Loading…</span>
                ) : (
                  <>
                    {formattedBalance}{" "}
                    <span className="text-muted-foreground">EFFECT</span>
                  </>
                )}
              </dd>
            </div>

            <div className="col-span-1">
              <dt className="text-muted-foreground">Stake status</dt>
              <dd className="mt-0.5 font-medium">
                {props.migrationAccount.exists ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 />
                    Staked
                  </span>
                ) : (
                  "Not staked"
                )}
              </dd>
            </div>

            <div className="col-span-2 md:col-span-1">
              <dt className="text-muted-foreground">Staked on</dt>
              <dd className="mt-0.5 font-medium">
                {stakedSince ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-sm text-muted-foreground">
          By claiming you authorize the migration from your legacy balance to
          EFFECT on Solana using your provided signature.
        </p>
        <p className="text-red-500 text-sm">
          IMPORTANT: claimed tokens will be locked in a staking account. If you
          do not have a staking account, one will be created for you (at no
          cost).
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          className="min-w-28"
          onClick={onClaim}
          disabled={!canClaim}
          aria-disabled={!canClaim}
        >
          {submitting ? "Claiming…" : "Claim"}
        </Button>
      </CardFooter>
    </Card>
  );
}
