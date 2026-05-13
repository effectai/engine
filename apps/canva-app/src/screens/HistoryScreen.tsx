/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Column,
  Columns,
  Rows,
  SurfaceHeader,
  Text,
} from "@canva/app-ui-kit";
import { useEffect, useState } from "react";
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
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [page, setPage] = useState<number>(0);

  useEffect(() => {
    const refresh = () => {
      getTasks().then(setTasks).catch(() => {});
    };
    refresh();
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
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
          title="Past Checks"
          start={{ ariaLabel: "Go back", onClick: onBack }}
        />
        {tasks.length === 0 ? (
          <Text alignment="center" size="small" tone="tertiary">
            No checks yet. Run your first check to see it here.
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
                    ariaLabel="Previous page"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  />
                </Column>
                <Column>
                  <Text alignment="center" size="small" tone="tertiary">
                    Page {currentPage + 1} of {pageCount}
                  </Text>
                </Column>
                <Column width="content">
                  <Button
                    variant="tertiary"
                    icon={ChevronRightIcon}
                    ariaLabel="Next page"
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
