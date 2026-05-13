/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import {
  Badge,
  Box,
  Button,
  ImageCard,
  Rows,
  SurfaceHeader,
  Text,
} from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { useEffect, useRef, useState } from "react";
import * as styles from "styles/components.css";
import { getTaskStatus } from "../api/effectApi";
import { ResultsSummary } from "../components/ResultsSummary";
import type { CheckType, TaskRecord } from "../types";
import { CHECK_TYPES } from "../types";

const REPORT_BASE_URL = "https://dataffect.xyz";
const POLL_INTERVAL_MS = 20_000;

type Props = {
  task: TaskRecord;
  onBack: () => void;
  onNewCheck: () => void;
};

function checkTypeLabel(type: CheckType): string {
  return CHECK_TYPES.find((checkTypeOption) => checkTypeOption.id === type)?.name ?? type;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const ResultsScreen = ({ task, onBack, onNewCheck }: Props) => {
  const [displayTask, setDisplayTask] = useState<TaskRecord>(task);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (displayTask.status === "complete") return;

    let cancelled = false;

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
      } catch {
        // keep polling silently on transient errors
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [displayTask.taskId, displayTask.status]);

  const thumbnailUrl = displayTask.imageUrl ?? displayTask.imageUrlA;

  const handleOpenReport = async () => {
    await requestOpenExternalUrl({
      url: `${REPORT_BASE_URL}/${displayTask.taskId}`,
    });
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <SurfaceHeader
          title="Results"
          start={{ ariaLabel: "Go back", onClick: onBack }}
        />
        {thumbnailUrl ? (
          <Box width="full">
            <ImageCard
              alt="Submitted design preview"
              thumbnailUrl={thumbnailUrl}
            />
          </Box>
        ) : null}

        <Rows spacing="1u">
          <Badge text={checkTypeLabel(displayTask.checkType)} tone="assist" />
          <Text size="small" tone="tertiary">
            {displayTask.workerCount} workers •{" "}
            {formatDate(displayTask.submittedAt)}
          </Text>
        </Rows>

        <ResultsSummary task={displayTask} />

        {displayTask.status !== "complete" ? (
          <Text size="small" tone="tertiary" alignment="center">
            Checking for results every 20 seconds...
          </Text>
        ) : null}

        <Rows spacing="1u">
          <Button variant="primary" onClick={handleOpenReport} stretch>
            View Full Report
          </Button>
          <Button variant="secondary" onClick={onNewCheck} stretch>
            New Check
          </Button>
        </Rows>
      </Rows>
    </div>
  );
};
