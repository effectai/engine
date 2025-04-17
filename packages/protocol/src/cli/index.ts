#!/usr/bin/env bun
import { program } from "commander";
import axios from "axios";
import { readFileSync } from "node:fs";
import path from "node:path";

// Types
type Task = {
  id?: string;
  title: string;
  reward: bigint;
  timeLimitSeconds: number;
  templateId: string;
  templateData: string;
};

type Template = {
  id: string;
  name: string;
  content: string;
  providerPeerId?: string;
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

program
  .name("task-cli")
  .description("CLI for interacting with task manager")
  .version("0.1.0");

program
  .command("tasks")
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
      const task: Task = {
        id: options.id,
        title: options.title,
        reward: BigInt(options.reward),
        timeLimitSeconds: parseInt(options.timeLimit),
        templateId: options.templateId,
        templateData: options.data,
      };

      const { data } = await api.post<APIResponse>(
        `${options.url}/tasks`,
        task,
      );

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

program
  .command("templates")
  .description("Template operations")
  .command("register")
  .description("Register a new template")
  .requiredOption("-u, --url <url>", "Manager node base URL")
  .requiredOption("-p, --template-path <path>", "Path to template file")
  .option("--id <id>", "Template ID (defaults to filename without extension)")
  .option("--name <name>", "Template name (defaults to filename)")
  .action(async (options) => {
    try {
      const filePath = path.resolve(options.templatePath);
      const content = readFileSync(filePath, "utf-8");
      const templateId =
        options.id || path.basename(filePath, path.extname(filePath));
      const templateName = options.name || path.basename(filePath);

      const template: Template = {
        id: templateId,
        name: templateName,
        content,
      };

      const { data } = await api.post<APIResponse>(
        `${options.url}/templates`,
        template,
      );
      console.log("✅ Template registered successfully:", data);
    } catch (error) {
      console.error(
        "❌ Error registering template:",
        axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : error,
      );
      process.exit(1);
    }
  });

program.parseAsync().catch(console.error);
