import * as React from "react";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // shadcn helper (clsx+twMerge)

export type StepKey = string; // or your union type

export type StepDef = {
  key: StepKey;
  label: string;
  description?: string;
  disabled?: boolean;
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
  const idx = Math.max(
    0,
    steps.findIndex((s) => s.key === current),
  );
  const pct = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Track */}
      <div className="relative">
        <ol className="flex items-center gap-3">
          {steps.map((s, i) => {
            const state =
              i < idx ? "complete" : i === idx ? "current" : "upcoming";
            const clickable = !!onStepChange && i <= idx && !s.disabled;

            return (
              <li key={s.key} className="flex items-center gap-2 min-w-0">
                <TooltipProvider>
                  <Tooltip disableHoverableContent={!s.description}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => clickable && onStepChange?.(s.key)}
                        disabled={s.disabled}
                        aria-current={state === "current" ? "step" : undefined}
                        aria-disabled={s.disabled || undefined}
                        className={cn(
                          "h-8 px-2 sm:px-3 gap-2 rounded-full",
                          "transition-colors",
                          state === "current" && "",
                          state === "complete" && "",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                            state === "complete" &&
                              "bg-emerald-600 text-white border-emerald-600",
                            state === "current" && "border-foreground/40",
                            state === "upcoming" &&
                              "border-muted-foreground/30 text-muted-foreground",
                          )}
                        >
                          {state === "complete" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 opacity-70" />
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
                            variant="secondary"
                            className="hidden sm:inline-block h-5 px-1.5 text-[10px]"
                          >
                            current
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>

                    {s.description && (
                      <TooltipContent side="bottom">
                        <p className="max-w-xs text-xs">{s.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* separator line between steps */}
              </li>
            );
          })}
        </ol>

        {/* progress bar under the steps (subtle) */}
        <div className="mt-2 h-1 w-full rounded-full bg-muted">
          <div
            className="h-1 rounded-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
