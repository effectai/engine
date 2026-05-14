import { Rows, Text, Title } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import type { IntlShape } from "react-intl";
import type { CheckResults, TaskRecord, WorkerFeedback } from "../types";

function resolvedFeedback(
  results: CheckResults | undefined,
  task: TaskRecord,
  intl: IntlShape,
): { rating: string; insight?: string }[] {
  if (!results?.feedback) return [];
  return results.feedback.map((fb: WorkerFeedback) => {
    if (results.kind !== "compare") return fb;
    const versionALabel = intl.formatMessage({ defaultMessage: "Version A", description: "Default label for version A in compare results" });
    const versionBLabel = intl.formatMessage({ defaultMessage: "Version B", description: "Default label for version B in compare results" });
    const label =
      fb.rating === "A"
        ? task.versionLabelA || versionALabel
        : task.versionLabelB || versionBLabel;
    return { ...fb, rating: label };
  });
}

type Props = {
  task: TaskRecord;
};

export const ResultsSummary = ({ task }: Props) => {
  const intl = useIntl();
  const feedback = resolvedFeedback(task.results, task, intl);

  function headlineFor(t: TaskRecord): string {
    const results = t.results;
    if (!results) {
      return intl.formatMessage({
        defaultMessage: "Results not available yet.",
        description: "Shown when a task has no results yet",
      });
    }
    if (results.kind === "clarity") {
      return intl.formatMessage(
        {
          defaultMessage: "Clarity Score: {score} / 10",
          description: "Clarity check headline showing the average score",
        },
        { score: results.score.toFixed(1) },
      );
    }
    if (results.kind === "clickability") {
      return intl.formatMessage(
        {
          defaultMessage: "{percent}% of workers would stop scrolling",
          description: "Clickability check headline showing the stop-scroll percentage",
        },
        { percent: results.stopScrollPercent },
      );
    }
    const labelA = t.versionLabelA || intl.formatMessage({ defaultMessage: "Version A", description: "Default label for version A in a compare check" });
    const labelB = t.versionLabelB || intl.formatMessage({ defaultMessage: "Version B", description: "Default label for version B in a compare check" });
    const winner = results.winner === "A" ? labelA : labelB;
    return intl.formatMessage(
      {
        defaultMessage: "{winner} wins ({won} out of {total} workers)",
        description: "Compare check headline showing which version won",
      },
      { winner, won: results.dimensionsWon, total: results.dimensionsTotal },
    );
  }

  return (
    <Rows spacing="1.5u">
      <Title size="medium">{headlineFor(task)}</Title>
      {feedback.length > 0 ? (
        <Rows spacing="0.5u">
          {feedback.map(({ rating, insight }, idx) => (
            <Text key={idx} size="small">
              {insight
                ? intl.formatMessage(
                    {
                      defaultMessage: "• {rating} - {insight}",
                      description: "Feedback item showing a rating and additional insight from a worker",
                    },
                    { rating, insight },
                  )
                : intl.formatMessage(
                    {
                      defaultMessage: "• {rating}",
                      description: "Feedback item showing a rating from a worker",
                    },
                    { rating },
                  )}
            </Text>
          ))}
        </Rows>
      ) : null}
    </Rows>
  );
};
