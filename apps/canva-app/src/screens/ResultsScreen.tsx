import {
  Alert,
  Badge,
  Box,
  Button,
  Column,
  Columns,
  ImageCard,
  Rows,
  SurfaceHeader,
  Text,
} from "@canva/app-ui-kit";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import type { IntlShape } from "react-intl";
import * as styles from "styles/components.css";
import { getTaskStatus, TaskNotFoundError } from "../api/effectApi";
import { ResultsSummary } from "../components/ResultsSummary";
import type { CheckType, TaskRecord } from "../types";
import { CHECK_TYPES, COMPARE_VERSION_TONES } from "../types";

const POLL_INTERVAL_MS = 20_000;

type Props = {
  task: TaskRecord;
  onBack: () => void;
  onNewCheck: () => void;
};

function checkTypeLabel(type: CheckType, intl: IntlShape): string {
  const meta = CHECK_TYPES.find(
    (checkTypeOption) => checkTypeOption.id === type,
  );
  return meta ? intl.formatMessage(meta.name) : type;
}

export const ResultsScreen = ({ task, onBack, onNewCheck }: Props) => {
  const intl = useIntl();
  const [displayTask, setDisplayTask] = useState<TaskRecord>(task);
  const [notFound, setNotFound] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (displayTask.status === "complete") return;

    let cancelled = false;

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const poll = async () => {
      try {
        const status = await getTaskStatus(displayTask.taskId);
        if (status.status === "complete" && status.results && !cancelled) {
          const updated: TaskRecord = {
            ...displayTask,
            status: "complete",
            results: status.results,
          };
          setDisplayTask(updated);
        }
      } catch (err) {
        if (err instanceof TaskNotFoundError) {
          if (!cancelled) setNotFound(true);
          stopPolling();
        }
        // keep polling silently on transient errors
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [displayTask.taskId, displayTask.status]);

  // Compare jobs pit two versions against each other - preview both, not just A.
  const compareImages =
    displayTask.checkType === "compare" &&
    displayTask.imageUrlA &&
    displayTask.imageUrlB
      ? [
          {
            url: displayTask.imageUrlA,
            tone: COMPARE_VERSION_TONES.A,
            label:
              displayTask.versionLabelA ||
              intl.formatMessage({
                defaultMessage: "Version A",
                description: "Default label for version A in a compare preview",
              }),
          },
          {
            url: displayTask.imageUrlB,
            tone: COMPARE_VERSION_TONES.B,
            label:
              displayTask.versionLabelB ||
              intl.formatMessage({
                defaultMessage: "Version B",
                description: "Default label for version B in a compare preview",
              }),
          },
        ]
      : null;
  const thumbnailUrl = displayTask.imageUrl ?? displayTask.imageUrlA;

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <SurfaceHeader
          title={intl.formatMessage({
            defaultMessage: "Results",
            description: "Title of the results screen",
          })}
          start={{
            ariaLabel: intl.formatMessage({
              defaultMessage: "Go back",
              description:
                "Aria label for the back button on the results screen",
            }),
            onClick: onBack,
          }}
        />
        {compareImages ? (
          <Columns spacing="1u">
            {compareImages.map((image) => (
              <Column key={image.label}>
                <Rows spacing="0.5u" align="center">
                  <Badge text={image.label} tone={image.tone} />
                  <Box width="full">
                    <ImageCard
                      alt={intl.formatMessage(
                        {
                          defaultMessage: "Version {label} preview",
                          description:
                            "Alt text for one of the two compared design versions",
                        },
                        { label: image.label },
                      )}
                      thumbnailUrl={image.url}
                    />
                  </Box>
                </Rows>
              </Column>
            ))}
          </Columns>
        ) : thumbnailUrl ? (
          <Box width="full">
            <ImageCard
              alt={intl.formatMessage({
                defaultMessage: "Submitted design preview",
                description:
                  "Alt text for the thumbnail of the submitted design",
              })}
              thumbnailUrl={thumbnailUrl}
            />
          </Box>
        ) : null}

        <Rows spacing="1u">
          <Badge
            text={checkTypeLabel(displayTask.checkType, intl)}
            tone="assist"
          />
          <Text size="small" tone="tertiary">
            {intl.formatMessage(
              {
                defaultMessage: "{count} testers • {date}",
                description:
                  "Tester count and submission date shown below check type badge",
              },
              {
                count: displayTask.workerCount,
                date: intl.formatDate(displayTask.submittedAt),
              },
            )}
          </Text>
        </Rows>

        {notFound ? (
          <Alert tone="critical">
            {intl.formatMessage({
              defaultMessage:
                "This task no longer exists. It may have been deleted.",
              description: "Error shown when the task cannot be found",
            })}
          </Alert>
        ) : (
          <ResultsSummary task={displayTask} />
        )}

        {!notFound && displayTask.status !== "complete" ? (
          <Text size="small" tone="tertiary" alignment="center">
            {intl.formatMessage({
              defaultMessage: "Checking for results every 20 seconds…",
              description: "Status text shown while polling for task results",
            })}
          </Text>
        ) : null}

        <Button variant="secondary" onClick={onNewCheck} stretch>
          {intl.formatMessage({
            defaultMessage: "New check",
            description: "Button to start a new design check",
          })}
        </Button>
      </Rows>
    </div>
  );
};
