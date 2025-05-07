import { Command } from "commander";
import axios from "axios";
import { ulid } from "ulid";

type Task = {
  id?: string;
  title: string;
  reward: bigint;
  timeLimitSeconds: number;
  templateId: string;
  templateData: string;
};

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
  .action(async (options) => {
    try {
      //get random image from https://picsum.photos/
      const imageUrl = `https://picsum.photos/400/400?random=${Math.floor(
        Math.random() * 1000,
      )}`;

      const task: Task = {
        id: ulid(),
        title: options.title,
        reward: options.reward.toString(),
        timeLimitSeconds: Number.parseInt(options.timeLimit),
        templateId: options.templateId,
        templateData: JSON.stringify({
          image_url: imageUrl,
        }),
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
