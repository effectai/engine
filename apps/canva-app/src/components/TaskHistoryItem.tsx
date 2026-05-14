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
import { useIntl } from "react-intl";
import type { IntlShape } from "react-intl";
import type { CheckType, TaskRecord, TaskStatus } from "../types";
import { CHECK_TYPES } from "../types";

const STATUS_TONE: Record<TaskStatus, "info" | "positive"> = {
  pending: "info",
  complete: "positive",
};

function checkTypeLabel(type: CheckType, intl: IntlShape): string {
  const meta = CHECK_TYPES.find((checkTypeOption) => checkTypeOption.id === type);
  return meta ? intl.formatMessage(meta.name) : type;
}

type Props = {
  task: TaskRecord;
  onView: () => void;
  onDelete: () => void;
};

export const TaskHistoryItem = ({ task, onView, onDelete }: Props) => {
  const intl = useIntl();

  const statusLabel: Record<TaskStatus, string> = {
    pending: intl.formatMessage({ defaultMessage: "Pending", description: "Task status badge - not yet complete" }),
    complete: intl.formatMessage({ defaultMessage: "Complete", description: "Task status badge - finished" }),
  };

  return (
    <Box
      background="neutralSubtle"
      border="ui"
      borderRadius="standard"
      padding="2u"
    >
      <Rows spacing="1u">
        <Title size="small">{checkTypeLabel(task.checkType, intl)}</Title>
        <Text size="small" tone="tertiary">
          {intl.formatMessage(
            { defaultMessage: "{count} workers", description: "Number of workers assigned to a task" },
            { count: task.workerCount },
          )}
        </Text>
        <Text size="small" tone="tertiary">
          {intl.formatDate(task.submittedAt)}
        </Text>
        <Badge
          text={statusLabel[task.status]}
          tone={STATUS_TONE[task.status]}
        />
        <Columns spacing="1u" alignY="center">
          <Column>
            <Button variant="secondary" onClick={onView} stretch>
              {intl.formatMessage({
                defaultMessage: "View results",
                description: "Button to view task results",
              })}
            </Button>
          </Column>
          <Column width="content">
            <Button
              variant="tertiary"
              icon={TrashIcon}
              ariaLabel={intl.formatMessage({
                defaultMessage: "Delete check",
                description: "Aria label for the delete task button",
              })}
              onClick={onDelete}
            />
          </Column>
        </Columns>
      </Rows>
    </Box>
  );
};
