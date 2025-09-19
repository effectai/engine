import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  useWalletContext,
  useConnectionContext,
} from "@effectai/react";
import { cn } from "@/lib/utils";
import type { Account, TransactionSigner } from "@solana/kit";
import type { StakeAccount } from "@effectai/staking";
import { Row, formatNumber, trimTrailingZeros } from "@/lib/utils.tsx";
import { useStakeMutation, useTopupMutation } from "@/lib/useMutations";

type Props = {
  stakeAccount: Account<StakeAccount> | null | undefined;
  signer: TransactionSigner;
  isPending?: boolean;
  lockPeriodDays?: number;
  tokenSymbol?: string;
  initialAmount?: number;
  className?: string;
};

const amountSchema = (max: number) =>
  z
    .string()
    .trim()
    .transform((s) => s.replace(",", "."))
    .refine((s) => /^\d*\.?\d*$/.test(s), "Enter a valid number")
    .transform((s) => (s === "" ? 0 : Number(s)))
    .refine((n) => isFinite(n) && n >= 0, "Amount must be a positive number")
    .refine((n) => n > 0, "Amount must be greater than 0")
    .refine((n) => n <= max, "Amount exceeds available balance")
    //have max 6 decimal places
    .transform((n) => Math.floor(n * 1e6) / 1e6);

export function StakeForm({
  stakeAccount,
  signer,
  isPending = false,
  lockPeriodDays = 30,
  tokenSymbol = "EFFECT",
  initialAmount = 0,
  className,
}: Props) {
  const { address, lamports, effectBalance, userTokenAccount } =
    useWalletContext();

  const { connection } = useConnectionContext();

  const max = Number(effectBalance?.uiAmount ?? 0);

  const form = useForm<{ amount: string }>({
    resolver: zodResolver(z.object({ amount: amountSchema(max) })),
    defaultValues: { amount: initialAmount ? String(initialAmount) : "" },
    mode: "onChange",
  });

  const amountStr = form.watch("amount")?.trim() || "";
  const amount = amountStr === "" ? 0 : Number(amountStr.replace(",", "."));

  const isValid = form.formState.isValid && amount > 0 && amount <= max;

  const setMax = () => {
    if (max <= 0) return;
    form.setValue("amount", trimTrailingZeros(max), { shouldValidate: true });
  };

  const setPercent = (p: number) => {
    const v = (max * p) / 100;
    form.setValue("amount", trimTrailingZeros(v), { shouldValidate: true });
  };

  const { mutateAsync: topup } = useTopupMutation();
  const onTopupHandler = React.useCallback(
    async (amount: number) => {
      topup({
        amount,
        connection,
        signer,
        stakeAccount,
        userTokenAccount,
      });
    },
    [connection, address, signer, stakeAccount, amount, userTokenAccount],
  );

  const { mutateAsync: stake } = useStakeMutation();
  const onStakeHandler = React.useCallback(
    async (amount: number) => {
      stake({
        amount,
        connection,
        signer,
        userTokenAccount,
      });
    },
    [connection, address, signer, userTokenAccount, amount],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    if (stakeAccount) {
      await onTopupHandler(values.amount);
    } else {
      await onStakeHandler(values.amount);
    }
  });

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Stake Tokens</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Amount to Stake
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={field.value}
                        onChange={(e) => {
                          const next = e.target.value
                            .replace(/[^\d.,]/g, "")
                            .replace(/,/g, ".")
                            .replace(/^(\d*\.\d*).*$/, "$1"); // enforce single dot
                          field.onChange(next);
                        }}
                        onBlur={field.onBlur}
                        className="pr-28"
                      />
                    </FormControl>

                    <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-2"
                        onClick={setMax}
                        disabled={max <= 0}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPercent(p)}
                  disabled={max <= 0}
                >
                  {p}%
                </Button>
              ))}
            </div>

            <div className="rounded-xl border bg-muted/30 px-3 py-4 space-y-2 text-sm">
              <Row
                label="Total to Stake"
                value={`${formatNumber(amount)} ${tokenSymbol}`}
              />
              <Row
                label="Current stake"
                value={`${formatNumber(Number(stakeAccount?.data.amount ?? 0) / 1e6)} ${tokenSymbol}`}
              />
              <Row
                label="Available Balance"
                value={`${formatNumber(max)} EFFECT`}
              />
              <Row label="Lock Period" value={`${lockPeriodDays} days`} />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isPending}
            >
              {isPending ? "Staking…" : "Stake"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
