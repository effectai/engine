import {
  Badge,
  Box,
  Button,
  Column,
  Columns,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import type { IntlShape } from "react-intl";
import type { CheckResults, TaskRecord, WorkerFeedback } from "../types";
import { CLICKABILITY_TONES, COMPARE_VERSION_TONES } from "../types";

const RESPONSES_PER_PAGE = 5;
const DEFAULT_RATING_TONE = "assist" as const;

function resolvedFeedback(
  results: CheckResults | undefined,
  task: TaskRecord,
  intl: IntlShape,
) {
  if (!results?.feedback) return [];
  return results.feedback.map((fb: WorkerFeedback) => {
    if (results.kind !== "compare") {
      const tone =
        results.kind === "clickability"
          ? fb.rating === "Yes"
            ? CLICKABILITY_TONES.yes
            : CLICKABILITY_TONES.no
          : DEFAULT_RATING_TONE;
      return { rating: fb.rating, insight: fb.insight, tone };
    }
    const versionALabel = intl.formatMessage({
      defaultMessage: "Version A",
      description: "Default label for version A in compare results",
    });
    const versionBLabel = intl.formatMessage({
      defaultMessage: "Version B",
      description: "Default label for version B in compare results",
    });
    const version = fb.rating === "A" ? "A" : "B";
    const label =
      version === "A"
        ? task.versionLabelA || versionALabel
        : task.versionLabelB || versionBLabel;
    return {
      rating: label,
      insight: fb.insight,
      tone: COMPARE_VERSION_TONES[version],
    };
  });
}

type Props = {
  task: TaskRecord;
};

export const ResultsSummary = ({ task }: Props) => {
  const intl = useIntl();
  const feedback = resolvedFeedback(task.results, task, intl);
  const [page, setPage] = useState(0);

  // Start back at the first page whenever we switch to a different task.
  useEffect(() => {
    setPage(0);
  }, [task.taskId]);

  const totalPages = Math.max(
    1,
    Math.ceil(feedback.length / RESPONSES_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * RESPONSES_PER_PAGE;
  const visibleFeedback = feedback.slice(
    pageStart,
    pageStart + RESPONSES_PER_PAGE,
  );

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
          defaultMessage: "{percent}% of testers would stop scrolling",
          description:
            "Clickability check headline showing the stop-scroll percentage",
        },
        { percent: results.stopScrollPercent },
      );
    }
    const labelA =
      t.versionLabelA ||
      intl.formatMessage({
        defaultMessage: "Version A",
        description: "Default label for version A in a compare check",
      });
    const labelB =
      t.versionLabelB ||
      intl.formatMessage({
        defaultMessage: "Version B",
        description: "Default label for version B in a compare check",
      });
    const winner = results.winner === "A" ? labelA : labelB;
    return intl.formatMessage(
      {
        defaultMessage: "{winner} wins ({won} out of {total} testers)",
        description: "Compare check headline showing which version won",
      },
      { winner, won: results.dimensionsWon, total: results.dimensionsTotal },
    );
  }

  return (
    <Rows spacing="1.5u">
      <Title size="medium">{headlineFor(task)}</Title>
      {feedback.length > 0 ? (
        <Rows spacing="1u">
          <Text size="small" tone="tertiary">
            {intl.formatMessage(
              {
                defaultMessage:
                  "{count, plural, one {# tester response} other {# tester responses}}",
                description:
                  "Heading above the list of individual tester responses",
              },
              { count: feedback.length },
            )}
          </Text>
          <Rows spacing="0.5u">
            {visibleFeedback.map(({ rating, insight, tone }, idx) => (
              <Box
                key={pageStart + idx}
                background="neutralSubtle"
                borderRadius="standard"
                padding="1u"
              >
                <Columns spacing="1u" alignY="center">
                  <Column width="content">
                    <Badge text={rating} tone={tone} />
                  </Column>
                  {insight ? (
                    <Column>
                      <Text size="small">{insight}</Text>
                    </Column>
                  ) : null}
                </Columns>
              </Box>
            ))}
          </Rows>
          {totalPages > 1 ? (
            <Columns spacing="1u" alignY="center">
              <Column width="content">
                <Button
                  variant="tertiary"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  {intl.formatMessage({
                    defaultMessage: "Previous",
                    description:
                      "Button to show the previous page of tester responses",
                  })}
                </Button>
              </Column>
              <Column>
                <Text size="small" tone="tertiary" alignment="center">
                  {intl.formatMessage(
                    {
                      defaultMessage: "Page {page} of {total}",
                      description:
                        "Indicator showing the current page of tester responses",
                    },
                    { page: safePage + 1, total: totalPages },
                  )}
                </Text>
              </Column>
              <Column width="content">
                <Button
                  variant="tertiary"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  {intl.formatMessage({
                    defaultMessage: "Next",
                    description:
                      "Button to show the next page of tester responses",
                  })}
                </Button>
              </Column>
            </Columns>
          ) : null}
        </Rows>
      ) : null}
    </Rows>
  );
};
