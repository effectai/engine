import * as React from "react";
import { Check, Circle, DiscIcon } from "lucide-react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Badge,
} from "@effectai/react";
import { cn } from "@/lib/utils"; // shadcn helper (clsx+twMerge)
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

export type StepKey = string; // or your union type

export type StepDef = {
  key: StepKey;
  label: string;
  description?: string;
  disabled?: boolean;
  hidden?: boolean;
};

type StepperProps = {
  steps: StepDef[];
  current: StepKey;
  onStepChange?: (key: StepKey) => void;
  className?: string;
  showLabels?: boolean; // hide labels on very small screens if false
};

export function Stepper({
  steps,
  current,
  onStepChange,
  className,
  showLabels = true,
  children,
}: React.PropsWithChildren<StepperProps>) {
  const idx =
    Math.max(
      0,
      steps.findIndex((s) => s.key === current),
    ) - 1;

  const pct = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full">
        <div className="flex-col flex">
          <div className="flex flex-col justify-center w-full">
            <div className="w-full flex justify-center flex-col items-center mx-auto ">
              <ol className="flex items-center gap-3">
                {steps
                  .filter((s) => !s.hidden)
                  .map((s, i) => {
                    const state =
                      i < idx ? "complete" : i === idx ? "current" : "upcoming";
                    const clickable = !!onStepChange && i <= idx && !s.disabled;

                    return (
                      <li
                        key={s.key}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <TooltipProvider>
                          <Tooltip disableHoverableContent={!s.description}>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="link"
                                onClick={() =>
                                  clickable && onStepChange?.(s.key)
                                }
                                disabled={s.disabled}
                                aria-current={
                                  state === "current" ? "step" : undefined
                                }
                                aria-disabled={s.disabled || undefined}
                                className={cn(
                                  "text-black h-8 px-2 sm:px-3 gap-2 rounded-full hover:no-underline",
                                  "transition-colors",
                                  state === "current" && "",
                                  state === "complete" && "",
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                                    state === "complete" &&
                                      "bg-black text-white border-emerald-600",
                                    state === "current" &&
                                      "border-foreground/40",
                                    state === "upcoming" &&
                                      "border-muted-foreground/30 text-muted-foreground",
                                  )}
                                >
                                  {state === "complete" && (
                                    <Check
                                      className="pl-[1px]"
                                      color="#E2FF03"
                                    />
                                  )}
                                </span>

                                {showLabels && (
                                  <span
                                    className={cn(
                                      "truncate max-w-[6.5rem] sm:max-w-[10rem] text-xs sm:text-sm text-left",
                                      state === "upcoming"
                                        ? "text-muted-foreground"
                                        : "",
                                    )}
                                    title={s.label}
                                  >
                                    {s.label}
                                  </span>
                                )}

                                {state === "current" && (
                                  <Badge
                                    variant="outline"
                                    className="hidden bg-accent sm:inline-block h-5 px-1.5 text-[10px]"
                                  >
                                    current
                                  </Badge>
                                )}
                              </Button>
                            </TooltipTrigger>

                            {s.description && (
                              <TooltipContent side="bottom">
                                <p className="max-w-xs text-xs">
                                  {s.description}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    );
                  })}
              </ol>

              <div className="mt-2 h-1 w-full rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-foreground transition-all"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>

              <div className="mt-6 w-full">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
