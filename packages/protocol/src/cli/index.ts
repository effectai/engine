#!/usr/bin/env bun
import { program } from "commander";
import axios from "axios";
import { readFileSync } from "node:fs";
import path from "node:path";
import { computeTemplateId } from "../../dist/core/utils.js";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { Template } from "../../dist/core/messages/effect.js";
import { LevelDatastore } from "datastore-level";
import { createManager } from "../../dist/manager/main.js";
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

program
  .command("templates")
  .description("Template operations")
  .command("register")
  .description("Register a new template")
  .requiredOption("-u, --url <url>", "Manager node base URL")
  .requiredOption("-p, --template-path <path>", "Path to template file")
  .requiredOption(
    "-k, --private-key <path>",
    "Path to provider private key file",
  )
  .option("--id <id>", "Template ID (defaults to filename without extension)")
  .option("--name <name>", "Template name (defaults to filename)")
  .action(async (options) => {
    try {
      const filePath = path.resolve(options.templatePath);
      const content = readFileSync(filePath, "utf-8");
      const templateName = options.name || path.basename(filePath);
      const privateKey = readFileSync(options.privateKey, "utf-8");

      // convert private key to Uint8Array
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      const keypair = await generateKeyPairFromSeed(
        "Ed25519",
        secretKey.slice(0, 32),
      );
      const providerPeerId = peerIdFromPrivateKey(keypair);

      const templateId = computeTemplateId(providerPeerId.toString(), content);

      const template: Template = {
        templateId,
        data: content,
        createdAt: Date.now(),
      };

      const { data } = await api.post<APIResponse>(
        `${options.url}/template/register`,
        {
          template,
          providerPeerIdStr: providerPeerId.toString(),
        },
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

program
  .command("manager")
  .description("Manager operations")
  .command("run")
  .requiredOption(
    "-k, --private-key <path>",
    "Path to manager private key file",
  )
  .action(async (options) => {
    try {
      const privateKey = readFileSync(options.privateKey, "utf-8");

      const secretKey = Uint8Array.from(JSON.parse(privateKey));

      const keypair = await generateKeyPairFromSeed(
        "Ed25519",
        secretKey.slice(0, 32),
      );

      const datastore = new LevelDatastore("/tmp/manager");
      await datastore.open();

      const manager = await createManager({
        privateKey: keypair,
        datastore,
        //automatically start managing tasks
        autoManage: true,
      });

      console.log("Manager started", manager.entity.getMultiAddress());
    } catch (e) {
      console.error("Error starting manager:", e);
      process.exit(1);
    }
  });

program.parseAsync().catch(console.error);
