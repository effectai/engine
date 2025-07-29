import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const BATCH_SIZE = process.env.PAYMENT_BATCH_SIZE || 10;

const template = `
export const PAYMENT_BATCH_SIZE = ${BATCH_SIZE};
`;

fs.writeFileSync("./clients/js/consts.ts", template);

console.log("✅ Circuit generated with batch size:", BATCH_SIZE);
