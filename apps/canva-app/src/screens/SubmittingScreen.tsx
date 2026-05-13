/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import {
  Alert,
  Button,
  LoadingIndicator,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { useEffect, useRef, useState } from "react";
import * as styles from "styles/components.css";
import { submitTask } from "../api/effectApi";
import type { TaskDraft, TaskRecord } from "../types";
import { estimatedWaitTime } from "../utils/estimatedWaitTime";

type Props = {
  drafts: TaskDraft[];
  onComplete: (tasks: TaskRecord[]) => void;
  onBack: () => void;
};

export const SubmittingScreen = ({ drafts, onComplete, onBack }: Props) => {
  const hasStartedRef = useRef(false);
  const [error, setError] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        const tasks: TaskRecord[] = [];
        for (const draft of drafts) {
          const { taskId } = await submitTask({
            checkType: draft.checkType,
            context: draft.context,
            workerCount: draft.workerCount,
            imageUrl: draft.imageUrl,
            imageUrlA: draft.imageUrlA,
            imageUrlB: draft.imageUrlB,
            versionLabelA: draft.versionLabelA,
            versionLabelB: draft.versionLabelB,
            revealDuration: draft.revealDuration,
          });

          const task: TaskRecord = {
            taskId,
            checkType: draft.checkType,
            status: "pending",
            submittedAt: new Date().toISOString(),
            workerCount: draft.workerCount,
            context: draft.context,
            imageUrl: draft.imageUrl,
            imageUrlA: draft.imageUrlA,
            imageUrlB: draft.imageUrlB,
            versionLabelA: draft.versionLabelA,
            versionLabelB: draft.versionLabelB,
            revealDuration: draft.revealDuration,
          };

          tasks.push(task);
        }

        if (!cancelled) {
          onComplete(tasks);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not submit your design.";
        setError(message);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [drafts, onComplete, attempt]);

  const handleRetry = () => {
    setError(undefined);
    hasStartedRef.current = false;
    setAttempt((n) => n + 1);
  };

  const firstDraft = drafts[0]!;

  if (error) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Title size="medium">Submission failed</Title>
          <Alert tone="critical">{error}</Alert>
          <Rows spacing="1u">
            <Button variant="primary" onClick={handleRetry} stretch>
              Try again
            </Button>
            <Button variant="secondary" onClick={onBack} stretch>
              Back
            </Button>
          </Rows>
        </Rows>
      </div>
    );
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u" align="center">
        <LoadingIndicator size="medium" />
        <Title size="medium">Submitting your design...</Title>
        <Text alignment="center" size="small">
          We are sending your design to Effect AI workers.
        </Text>
        <Text alignment="center" size="small" tone="tertiary">
          {estimatedWaitTime(firstDraft.workerCount)}
        </Text>
      </Rows>
    </div>
  );
};
