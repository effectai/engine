import {
  Alert,
  Badge,
  Box,
  Button,
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
import { CHECK_TYPES } from "../types";

const POLL_INTERVAL_MS = 20_000;

type Props = {
  task: TaskRecord;
  onBack: () => void;
  onNewCheck: () => void;
};

function checkTypeLabel(type: CheckType, intl: IntlShape): string {
  const meta = CHECK_TYPES.find((checkTypeOption) => checkTypeOption.id === type);
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
              description: "Aria label for the back button on the results screen",
            }),
            onClick: onBack,
          }}
        />
        {thumbnailUrl ? (
          <Box width="full">
            <ImageCard
              alt={intl.formatMessage({
                defaultMessage: "Submitted design preview",
                description: "Alt text for the thumbnail of the submitted design",
              })}
              thumbnailUrl={thumbnailUrl}
            />
          </Box>
        ) : null}

        <Rows spacing="1u">
          <Badge text={checkTypeLabel(displayTask.checkType, intl)} tone="assist" />
          <Text size="small" tone="tertiary">
            {intl.formatMessage(
              { defaultMessage: "{count} workers • {date}", description: "Worker count and submission date shown below check type badge" },
              { count: displayTask.workerCount, date: intl.formatDate(displayTask.submittedAt) },
            )}
          </Text>
        </Rows>

        {notFound ? (
          <Alert tone="critical">
            {intl.formatMessage({
              defaultMessage: "This task no longer exists. It may have been deleted.",
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
