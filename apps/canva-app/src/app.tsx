import { useState } from "react";
import { ConfigureScreen } from "./screens/ConfigureScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { SubmittingScreen } from "./screens/SubmittingScreen";
import type { CheckType, Screen, TaskDraft, TaskRecord } from "./types";

export const App = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedCheckType, setSelectedCheckType] = useState<CheckType | null>(
    null,
  );
  const [pendingDrafts, setPendingDrafts] = useState<TaskDraft[] | null>(null);
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);

  if (screen === "home") {
    return (
      <HomeScreen
        onSelectCheckType={(type) => {
          setSelectedCheckType(type);
          setScreen("configure");
        }}
        onViewHistory={() => setScreen("history")}
      />
    );
  }

  if (screen === "configure" && selectedCheckType) {
    return (
      <ConfigureScreen
        checkType={selectedCheckType}
        onBack={() => {
          setSelectedCheckType(null);
          setScreen("home");
        }}
        onSubmit={(drafts) => {
          setPendingDrafts(drafts);
          setScreen("submitting");
        }}
      />
    );
  }

  if (screen === "submitting" && pendingDrafts) {
    return (
      <SubmittingScreen
        drafts={pendingDrafts}
        onComplete={(tasks) => {
          setPendingDrafts(null);
          if (tasks.length === 1) {
            setActiveTask(tasks[0]!);
            setScreen("results");
          } else {
            setScreen("history");
          }
        }}
        onBack={() => {
          setPendingDrafts(null);
          setScreen("configure");
        }}
      />
    );
  }

  if (screen === "results" && activeTask) {
    return (
      <ResultsScreen
        task={activeTask}
        onBack={() => {
          setActiveTask(null);
          setSelectedCheckType(null);
          setScreen("history");
        }}
        onNewCheck={() => {
          setActiveTask(null);
          setSelectedCheckType(null);
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "history") {
    return (
      <HistoryScreen
        onBack={() => setScreen("home")}
        onViewTask={(task) => {
          setActiveTask(task);
          setScreen("results");
        }}
      />
    );
  }

  return (
    <HomeScreen
      onSelectCheckType={(type) => {
        setSelectedCheckType(type);
        setScreen("configure");
      }}
      onViewHistory={() => setScreen("history")}
    />
  );
};