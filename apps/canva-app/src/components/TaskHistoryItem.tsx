/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import {
  Badge,
  Box,
  Button,
  Column,
  Columns,
  Rows,
  Text,
  Title,
  TrashIcon,
} from "@canva/app-ui-kit";
import type { CheckType, TaskRecord, TaskStatus } from "../types";
import { CHECK_TYPES } from "../types";

const STATUS_TONE: Record<TaskStatus, "info" | "positive"> = {
  pending: "info",
  complete: "positive",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  complete: "Complete",
};

function checkTypeLabel(type: CheckType): string {
  return CHECK_TYPES.find((checkTypeOption) => checkTypeOption.id === type)?.name ?? type;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

type Props = {
  task: TaskRecord;
  onView: () => void;
  onDelete: () => void;
};

export const TaskHistoryItem = ({ task, onView, onDelete }: Props) => {
  return (
    <Box
      background="neutralSubtle"
      border="ui"
      borderRadius="standard"
      padding="2u"
    >
      <Rows spacing="1u">
        <Title size="small">{checkTypeLabel(task.checkType)}</Title>
        <Text size="small" tone="tertiary">
          {task.taskId}
        </Text>
        <Text size="small" tone="tertiary">
          {formatDate(task.submittedAt)}
        </Text>
        <Badge
          text={STATUS_LABEL[task.status]}
          tone={STATUS_TONE[task.status]}
        />
        <Columns spacing="1u" alignY="center">
          <Column>
            <Button variant="secondary" onClick={onView} stretch>
              View Results
            </Button>
          </Column>
          <Column width="content">
            <Button
              variant="tertiary"
              icon={TrashIcon}
              ariaLabel="Delete check"
              onClick={onDelete}
            />
          </Column>
        </Columns>
      </Rows>
    </Box>
  );
};
