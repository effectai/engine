import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  useWalletContext,
  useConnectionContext,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@effectai/react";
import { Info, CheckCircle2, Clock, Check } from "lucide-react";
import type { fetchMaybeMigrationAccount } from "@effectai/migration";
import { useClaimMutation } from "@/hooks/useClaimMutation";

type Props = {
  migrationVaultBalance: number | null;
  migrationAccount: Awaited<ReturnType<typeof fetchMaybeMigrationAccount>>;
  foreignPublicKey: Uint8Array;
  message: string | Uint8Array;
  signature: string | Uint8Array;
  className?: string;
};

export default function ClaimCard(props: Props) {
  const [submitting, setSubmitting] = useState(false);
  const balance = props.migrationVaultBalance ?? 0;

  const { signer } = useWalletContext();
  const { connection } = useConnectionContext();

  const { mutateAsync: claim, isSuccess } = useClaimMutation();

  const formattedBalance = useMemo(
    () =>
      balance.toLocaleString(undefined, {
        maximumFractionDigits: 6,
      }),
    [balance],
  );

  const stakedSince = useMemo(() => {
    if (!props.migrationAccount.exists) return null;

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

      if (!signer) {
        throw new Error("No Solana wallet connected");
      }

      const message =
        typeof props.message === "string"
          ? new TextEncoder().encode(props.message)
          : props.message;

      const signature =
        typeof props.signature === "string"
          ? Uint8Array.from(Buffer.from(props.signature, "hex"))
          : props.signature;

      await claim({
        connection,
        signer,
        address: signer?.address,
        migrationAccount: props.migrationAccount.address,
        message,
        signature,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return isSuccess ? (
    <ClaimSuccessCard className={props.className} />
  ) : (
    <>
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Almost there</AlertTitle>
        <AlertDescription>
          Review the claim details and submit the transaction on Solana. Keep a
          small amount of SOL for fees.
        </AlertDescription>
      </Alert>

      <ClaimPendingCard
        className={props.className}
        balance={balance}
        formattedBalance={formattedBalance}
        vaultBalance={props.migrationVaultBalance}
        stakedSince={stakedSince}
        onClaim={onClaim}
        canClaim={canClaim}
        submitting={submitting}
      />
    </>
  );
}

export const ClaimPendingCard = (props: {
  className?: string;
  balance: number;
  formattedBalance?: string;
  vaultBalance?: number | null;
  stakedSince?: string | null;
  onClaim: () => void;
  canClaim: boolean;
  submitting: boolean;
}) => {
  return (
    <Card className={props.className}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          Ready to claim your <span className="font-bold">EFFECT</span> tokens
          {props.balance > 0 ? (
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
                {props.vaultBalance === null ? (
                  <span className="italic text-muted-foreground">Loading…</span>
                ) : (
                  <>
                    {props.formattedBalance}{" "}
                    <span className="text-muted-foreground">EFFECT</span>
                  </>
                )}
              </dd>
            </div>

            <div className="col-span-1">
              <dt className="text-muted-foreground">Stake status</dt>
              <dd className="mt-0.5 font-medium">
                {props.stakedSince ? (
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
                {props.stakedSince ?? (
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
          do not have a staking account, one will be created for you at no cost.
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          className="min-w-28"
          onClick={props.onClaim}
          disabled={!props.canClaim}
          aria-disabled={!props.canClaim}
        >
          {props.submitting ? "Claiming…" : "Claim"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ClaimSuccessCard = (props: { className?: string }) => {
  return (
    <Card className={props.className}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          Claim submitted
          <Badge className="ml-2 bg-accent text-black">
            <Check className="mr-1 h-4 w-4" />
            Success
          </Badge>
        </CardTitle>
        <CardDescription>
          Your claim has been submitted successfully. It may take a few minutes
          to process.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/50 p-4">
          <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="col-span-1">
              <dt className="text-muted-foreground">Processing time</dt>
              <dd className="mt-0.5 font-medium inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Until confirmed on Solana
              </dd>
            </div>

            <div className="col-span-1">
              <dt className="text-muted-foreground">Next steps</dt>
              <dd className="mt-0.5 font-medium">
                Head over to staking.effect.ai to manage your EFFECT tokens.
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
};
