import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const BATCH_SIZE = process.env.PAYMENT_BATCH_SIZE || 10;

const template = `
export const PAYMENT_BATCH_SIZE = ${BATCH_SIZE};
`;

fs.writeFileSync("./clients/js/consts.ts", template);

console.log("✅ Circuit generated with batch size:", BATCH_SIZE);
