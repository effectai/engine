import { cpSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const targetIdlDir = path.resolve("./target/idl");
const destIdlDir = path.resolve("./idls");

mkdirSync(destIdlDir, { recursive: true });

for (const file of readdirSync(targetIdlDir)) {
  if (!file.endsWith(".json")) continue;
  cpSync(path.join(targetIdlDir, file), path.join(destIdlDir, file));
  console.log(`✓ Copied ${file}`);
}
