import { Command } from "commander";
import axios from "axios";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  generateKeyPairFromSeed,
  peerIdFromPrivateKey,
  computeTemplateId,
} from "@effectai/protocol";
import type { Template } from "@effectai/protobufs";

export const templateCommand = new Command();

type APIResponse = {
  status: string;
  data?: any;
  error?: string;
};

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

templateCommand
  .name("templates")
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
      // const templateName = options.name || path.basename(filePath);
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
