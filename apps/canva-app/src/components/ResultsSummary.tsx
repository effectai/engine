/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import { Rows, Text, Title } from "@canva/app-ui-kit";
import type { CheckResults, TaskRecord, WorkerFeedback } from "../types";

function headlineFor(task: TaskRecord): string {
  const results = task.results;
  if (!results) {
    return "Results not available yet.";
  }
  if (results.kind === "clarity") {
    return `Clarity Score: ${results.score.toFixed(1)} / 10`;
  }
  if (results.kind === "clickability") {
    return `${results.stopScrollPercent}% of workers would stop scrolling`;
  }
  const labels = {
    A: task.versionLabelA || "Version A",
    B: task.versionLabelB || "Version B",
  };
  return `${labels[results.winner]} wins (${results.dimensionsWon} out of ${results.dimensionsTotal} dimensions)`;
}

function resolvedFeedback(
  results: CheckResults | undefined,
  task: TaskRecord,
): Array<{ rating: string; insight?: string }> {
  if (!results?.feedback) return [];
  return results.feedback.map((fb: WorkerFeedback) => {
    if (results.kind !== "compare") return fb;
    const label =
      fb.rating === "A"
        ? task.versionLabelA || "Version A"
        : task.versionLabelB || "Version B";
    return { ...fb, rating: label };
  });
}

type Props = {
  task: TaskRecord;
};

export const ResultsSummary = ({ task }: Props) => {
  const feedback = resolvedFeedback(task.results, task);

  return (
    <Rows spacing="1.5u">
      <Title size="medium">{headlineFor(task)}</Title>
      {feedback.length > 0 ? (
        <Rows spacing="0.5u">
          {feedback.map(({ rating, insight }, idx) => (
            <Text key={idx} size="small">
              • <Text size="small" variant="bold">{rating}</Text>
              {insight ? ` — ${insight}` : ""}
            </Text>
          ))}
        </Rows>
      ) : null}
    </Rows>
  );
};
