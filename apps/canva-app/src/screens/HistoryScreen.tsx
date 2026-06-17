import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Column,
  Columns,
  LoadingIndicator,
  Rows,
  SurfaceHeader,
  Text,
} from "@canva/app-ui-kit";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { deleteTask, getTasks } from "../api/effectApi";
import { TaskHistoryItem } from "../components/TaskHistoryItem";
import type { TaskRecord } from "../types";

type Props = {
  onBack: () => void;
  onViewTask: (task: TaskRecord) => void;
};

const PAGE_SIZE = 3;
const POLL_INTERVAL_MS = 20000;

export const HistoryScreen = ({ onBack, onViewTask }: Props) => {
  const intl = useIntl();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(0);

  useEffect(() => {
    getTasks()
      .then((t) => {
        setTasks(t);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const intervalId = setInterval(() => {
      getTasks()
        .then(setTasks)
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const pageCount = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * PAGE_SIZE;
  const visibleTasks = tasks.slice(start, start + PAGE_SIZE);

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId).catch(() => {});
    const next = tasks.filter((task) => task.taskId !== taskId);
    setTasks(next);
    const nextPageCount = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
    if (currentPage > nextPageCount - 1) {
      setPage(nextPageCount - 1);
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <SurfaceHeader
          title={intl.formatMessage({
            defaultMessage: "Past checks",
            description: "Title of the history screen",
          })}
          start={{
            ariaLabel: intl.formatMessage({
              defaultMessage: "Go back",
              description:
                "Aria label for the back button on the history screen",
            }),
            onClick: onBack,
          }}
        />
        {loading ? (
          <LoadingIndicator size="medium" />
        ) : tasks.length === 0 ? (
          <Text alignment="center" size="small" tone="tertiary">
            {intl.formatMessage({
              defaultMessage:
                "No checks yet. Run your first check to see it here.",
              description: "Empty state message on the history screen",
            })}
          </Text>
        ) : (
          <Rows spacing="1.5u">
            {visibleTasks.map((task) => (
              <TaskHistoryItem
                key={task.taskId}
                task={task}
                onView={() => onViewTask(task)}
                onDelete={() => handleDelete(task.taskId)}
              />
            ))}
            {pageCount > 1 ? (
              <Columns spacing="1u" alignY="center">
                <Column width="content">
                  <Button
                    variant="tertiary"
                    icon={ChevronLeftIcon}
                    ariaLabel={intl.formatMessage({
                      defaultMessage: "Previous page",
                      description:
                        "Aria label for the previous page button in history",
                    })}
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  />
                </Column>
                <Column>
                  <Text alignment="center" size="small" tone="tertiary">
                    {intl.formatMessage(
                      {
                        defaultMessage: "Page {current} of {total}",
                        description:
                          "Pagination indicator in the history screen",
                      },
                      { current: currentPage + 1, total: pageCount },
                    )}
                  </Text>
                </Column>
                <Column width="content">
                  <Button
                    variant="tertiary"
                    icon={ChevronRightIcon}
                    ariaLabel={intl.formatMessage({
                      defaultMessage: "Next page",
                      description:
                        "Aria label for the next page button in history",
                    })}
                    disabled={currentPage >= pageCount - 1}
                    onClick={() => setPage(currentPage + 1)}
                  />
                </Column>
              </Columns>
            ) : null}
          </Rows>
        )}
      </Rows>
    </div>
  );
};
