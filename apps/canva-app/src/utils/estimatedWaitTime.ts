import type { IntlShape } from "react-intl";

export function estimatedWaitTime(
  workerCount: number,
  intl: IntlShape,
): string {
  const mins = Math.round(workerCount * 3);
  return intl.formatMessage(
    {
      defaultMessage: "Results usually ready in {from} to {to} minutes",
      description: "Estimated wait time shown on the submitting screen",
    },
    { from: mins, to: mins + 15 },
  );
}
