import { Command } from "commander";
import axios from "axios";
import { ulid } from "ulid";
import type { Task } from "@effectai/protobufs";

type APIResponse = {
  status: string;
  data?: any;
  error?: string;
};

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

export const taskCommand = new Command();

taskCommand
  .name("tasks")
  .description("Task operations")
  .command("post")
  .description("Post a new task")
  .requiredOption("-u, --url <url>", "Manager node base URL")
  .requiredOption("-t, --template-id <id>", "Template ID")
  .option("--title <title>", "Task title", "Default Task")
  .option("--reward <reward>", "Task reward", "100")
  .option("--time-limit <seconds>", "Time limit in seconds", "600")
  .option("--data <json>", "Template data as JSON string", "{}")
  .option("--id <taskId>", "Custom task ID")
  .option("--capability <string>", "capability string to match workers")
  .action(async (options) => {
    try {
      const task: Task = {
        id: ulid(),
        title: options.title,
        reward: options.reward.toString(),
        timeLimitSeconds: Number.parseInt(options.timeLimit),
        templateId: options.templateId,
        templateData: options.data || {},
        capability: options.capability || "",
      };

      const { data } = await api.post<APIResponse>(`${options.url}/task`, task);

      console.log("✅ Task posted successfully:", data);
    } catch (error) {
      console.error(
        "❌ Error posting task:",
        axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : error,
      );
      process.exit(1);
    }
  });
