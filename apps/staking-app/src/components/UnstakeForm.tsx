import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@effectai/ui";
import { Input } from "@effectai/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { Account, TransactionSigner } from "@solana/kit";
import { SolanaError, address as toAddress } from "@solana/kit";
import { formatNumber, Row, shorten, trimTrailingZeros } from "@/lib/helpers";
import type { StakeAccount } from "@effectai/stake";
import { buildUnstakeInstruction } from "@effectai/solana-utils";
import { useSolanaContext } from "@/providers/SolanaProvider";
import { EFFECT } from "@/lib/useEffectConfig";

type Props = {
  stakeAccount: Account<StakeAccount>;
  signer: TransactionSigner;
  isPending?: boolean;
  tokenSymbol?: string;
  className?: string;
};

export function UnstakeForm({
  signer,
  stakeAccount,
  isPending = false,
  tokenSymbol = "EFFECT",
  className,
}: Props) {
  const { connection, address } = useSolanaContext();
  const max = Number(stakeAccount.data.amount / BigInt(1e6));

  const schema = React.useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .trim()
          .transform((s) => s.replace(",", "."))
          .refine((s) => /^\d*\.?\d*$/.test(s), "Enter a valid number")
          .transform((s) => (s === "" ? 0 : Number(s)))
          .refine(
            (n) => isFinite(n) && n >= 0,
            "Amount must be a positive number",
          )
          .refine((n) => n > 0, "Amount must be greater than 0")
          .refine((n) => n <= max, "Amount exceeds available balance"),
      }),
    [max],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
    mode: "onChange",
  });

  const amountStr = form.watch("amount")?.toString() ?? "";
  const amount =
    typeof amountStr === "number" ? amountStr : Number(amountStr || 0);
  const isValid = form.formState.isValid && amount > 0 && amount <= max;

  const setMax = () => {
    if (max <= 0) return;
    form.setValue("amount", trimTrailingZeros(max), { shouldValidate: true });
  };

  const setPercent = (p: number) => {
    if (max <= 0) return;
    const v = (max * p) / 100;
    form.setValue("amount", trimTrailingZeros(v), { shouldValidate: true });
  };

  const onUnstakeHandler = React.useCallback(
    async (amount: number) => {
      try {
        if (!connection || !address || !signer) {
          throw new Error("No connection available");
        }

        const userTokenAccount = await connection.getTokenAccountAddress(
          toAddress(address),
          toAddress(EFFECT.EFFECT_SPL_MINT),
        );

        const unstakeInstructions = await buildUnstakeInstruction({
          amount: amount * 1e6,
          mint: toAddress(EFFECT.EFFECT_SPL_MINT),
          userTokenAccount,
          stakeAccount: stakeAccount.address,
          rpc: connection.rpc,
          signer,
        });

        return await connection.sendTransactionFromInstructions({
          feePayer: signer,
          instructions: unstakeInstructions,
          maximumClientSideRetries: 3,
        });
      } catch (e) {
        if (e instanceof SolanaError) {
          console.error("SolanaError: ", e.context);
        } else {
          console.error("Error: ", e);
        }
      }
    },
    [connection, address, signer, stakeAccount],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    await onUnstakeHandler(values.amount);
  });

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Unstake Tokens</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Context */}
            <div className="rounded-xl border bg-muted/30 px-3 py-4 space-y-2 text-sm">
              <Row
                label="Stake account"
                value={shorten(stakeAccount.address)}
              />
              <Row
                label="Currently staked"
                value={`${formatNumber(Number(stakeAccount.data.amount / BigInt(1e6)))} ${tokenSymbol}`}
              />
              <Row
                label="Available to unstake"
                value={`${formatNumber(max)} ${tokenSymbol}`}
              />
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Amount to Unstake
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={String(field.value ?? "")}
                        onChange={(e) => {
                          const next = e.target.value
                            .replace(/[^\d.,]/g, "")
                            .replace(/,/g, ".")
                            .replace(/^(\d*\.\d*).*$/, "$1");
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

            {/* Quick % chips */}
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

            {/* Preview */}
            <div className="rounded-xl border bg-muted/20 px-3 py-3 text-sm">
              <Row
                label="Unstaking"
                value={`${formatNumber(
                  typeof amount === "number" && isFinite(amount) ? amount : 0,
                )} ${tokenSymbol}`}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isPending}
            >
              {isPending ? "Unstaking…" : "Unstake"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
