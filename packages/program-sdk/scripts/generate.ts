import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { createFromRoot } from "codama";
import { readFileSync } from "node:fs";
import { renderVisitor } from "@codama/renderers-js";

import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targets = [
  {
    name: "payments",
    idl: "effect_payment.json",
  },
  {
    name: "migration",
    idl: "effect_migration.json",
  },
  {
    name: "staking",
    idl: "effect_staking.json",
  },
  {
    name: "vesting",
    idl: "effect_vesting.json",
  },
  {
    name: "rewards",
    idl: "effect_rewards.json",
  },
];

const idl_folder = path.join(__dirname, "../../../solana/idls/");
const loadIdl = (relativePath: string) => {
  return JSON.parse(readFileSync(path.join(idl_folder, relativePath), "utf-8"));
};

const generateClient = (name: string, idlPath: string) => {
  const idl = loadIdl(idlPath);
  const codama = createFromRoot(rootNodeFromAnchor(idl));
  const pathToGeneratedFolder = path.join(__dirname, "../src/clients/js", name);
  const options = {};
  codama.accept(renderVisitor(pathToGeneratedFolder, options));
};

for (const target of targets) {
  const { name, idl } = target;
  console.log(`Generating client for ${name}...`);
  generateClient(name, idl);
}
