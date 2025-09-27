import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.resolve(cwd, ".env");
const envProdPath = path.resolve(cwd, ".env.production");

let envFile: string;

if (fs.existsSync(envPath)) {
  envFile = envPath;
  console.log("🔹 Using .env file");
} else if (fs.existsSync(envProdPath)) {
  envFile = envProdPath;
  console.log("🔹 .env not found, using .env.production");
} else {
  console.warn("! No .env or .env.production file found, using defaults");
}

if (envFile) {
  dotenv.config({ path: envFile });
}

const BATCH_SIZE = process.env.PAYMENT_BATCH_SIZE || 50;

const template = `
export const PAYMENT_BATCH_SIZE = ${BATCH_SIZE};
`;

fs.writeFileSync("./clients/js/consts.ts", template);

console.log("✅ Circuit generated with batch size:", BATCH_SIZE);
