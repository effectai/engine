import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

type KeyMap = Record<string, string>;

function getAnchorKeys(): KeyMap {
  const out = execSync("anchor keys list", {
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString()
    .trim();

  const map: KeyMap = {};
  const lines = out.split(/\r?\n/);

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const rawName = line.slice(0, idx).trim();
    const addr = line.slice(idx + 1).trim();

    if (!addr) continue;

    const base = rawName.includes("/") ? rawName.split("/").pop()! : rawName;

    const parts = base.split("_");
    const keyName =
      parts.length > 1 ? `${parts[1]}_program` : `${base}_program`;

    map[keyName] = addr;
  }
  return map;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

export const buildProgramsLocal = async () => {
  try {
    execSync("anchor keys list", { stdio: ["ignore", "pipe", "ignore"] });
  } catch {}

  //only continue if /idls does not exist or is empty
  if (existsSync("./idls") && readdirSync("./idls").length > 0) {
    console.log("Local IDLs already exist; skipping IDL copy.");
    return;
  }

  const keyMap = getAnchorKeys();

  const idlsDir = path.resolve("./idls");

  ensureDir(idlsDir);
  const mainnetDir = path.resolve("./tools/idls");

  // Gather existing local IDLs
  const existingIdls = existsSync(idlsDir)
    ? readdirSync(idlsDir).filter((f) => f.endsWith(".json"))
    : [];

  if (existingIdls.length > 0) {
    console.log(`Found ${existingIdls.length} local IDL(s); nothing to copy.`);
    return;
  }

  if (!existsSync(mainnetDir)) {
    console.log("No idls/mainnet directory found; nothing to copy.");
    return;
  }

  console.log("No local IDLs found, copying from mainnet...");

  const mainnetFiles = readdirSync(mainnetDir).filter((f) =>
    f.endsWith(".json"),
  );

  for (const file of mainnetFiles) {
    const src = path.join(mainnetDir, file);
    const raw = readFileSync(src, "utf-8");

    let idl: any;
    try {
      idl = JSON.parse(raw);
    } catch (e) {
      console.warn(`!  Skipping ${file}: invalid JSON (${e})`);
      continue;
    }

    // Derive key map lookup key from filename
    // e.g. "<prefix>_<name>.json" -> "<name>_program"
    const base = path.basename(file, ".json");
    const parts = base.split("_");
    const key = (parts.length > 1 ? parts[1] : base) + "_program";

    if (!keyMap[key]) {
      console.warn(
        `!  No program ID in keyMap for ${file} (lookup key: ${key}), copying unchanged.`,
      );
    } else {
      idl.address = keyMap[key];
    }

    if (idl?.instructions && Array.isArray(idl.instructions)) {
      for (const ix of idl.instructions) {
        if (!ix?.accounts) continue;
        for (const account of ix.accounts) {
          if (!account?.name) continue;
          const programId = keyMap[account.name as keyof KeyMap];
          if (programId) {
            if ("address" in account || account.address !== undefined) {
              account.address = programId;
            }
          }
        }
      }
    }

    const dst = path.join(idlsDir, file);
    writeFileSync(dst, JSON.stringify(idl, null, 2));
    console.log(
      `Wrote local IDL for ${file}${keyMap[key] ? ` (address: ${keyMap[key]})` : ""}`,
    );
  }
};

buildProgramsLocal().catch((err) => {
  console.error(err);
  process.exit(1);
});
