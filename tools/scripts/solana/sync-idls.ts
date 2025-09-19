import { cpSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const targetIdlDir = path.resolve("./target/idl");
const destIdlDir = path.resolve("./idls");

// ensure ./idls exists
mkdirSync(destIdlDir, { recursive: true });

// copy all *.json
for (const file of readdirSync(targetIdlDir)) {
  if (!file.endsWith(".json")) continue;
  cpSync(path.join(targetIdlDir, file), path.join(destIdlDir, file));
  console.log(`✓ Copied ${file}`);
}
