import {
  Alert,
  Button,
  LoadingIndicator,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
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
  const intl = useIntl();
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
          err instanceof Error ? err.message : intl.formatMessage({
            defaultMessage: "Could not submit your design.",
            description: "Generic error message when submission fails",
          });
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
          <Title size="medium">
            {intl.formatMessage({
              defaultMessage: "Submission failed",
              description: "Heading shown when task submission fails",
            })}
          </Title>
          <Alert tone="critical">{error}</Alert>
          <Rows spacing="1u">
            <Button variant="primary" onClick={handleRetry} stretch>
              {intl.formatMessage({
                defaultMessage: "Try again",
                description: "Button to retry a failed submission",
              })}
            </Button>
            <Button variant="secondary" onClick={onBack} stretch>
              {intl.formatMessage({
                defaultMessage: "Back",
                description: "Button to go back from the failed submission screen",
              })}
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
        <Title size="medium">
          {intl.formatMessage({
            defaultMessage: "Submitting your design…",
            description: "Heading shown while a design is being submitted",
          })}
        </Title>
        <Text alignment="center" size="small">
          {intl.formatMessage({
            defaultMessage: "Sending your design to Effect AI testers.",
            description: "Body text shown while a design is being submitted",
          })}
        </Text>
        <Text alignment="center" size="small" tone="tertiary">
          {estimatedWaitTime(firstDraft.workerCount, intl)}
        </Text>
      </Rows>
    </div>
  );
};
