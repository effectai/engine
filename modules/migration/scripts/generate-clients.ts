import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { createFromRoot } from "codama";
import { readFileSync } from "node:fs";
import { renderVisitor } from "@codama/renderers-js";

import { fileURLToPath } from "node:url";
import path from "node:path";

const isMainnet = process.argv.includes("--mainnet");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targets = [
  {
    name: "migration",
    idl: isMainnet ? "effect_migration.json" : "effect_migration_localnet.json",
  },
];

const idl_folder = path.join(__dirname, "../../../idls/");
const loadIdl = (relativePath: string) => {
  return JSON.parse(readFileSync(path.join(idl_folder, relativePath), "utf-8"));
};

const generateClient = (name: string, idlPath: string) => {
  const idl = loadIdl(idlPath);

  const codama = createFromRoot(rootNodeFromAnchor(idl));
  const pathToGeneratedFolder = path.join(
    __dirname,
    "../clients/js/@generated",
    name,
  );
  const options = {};
  codama.accept(renderVisitor(pathToGeneratedFolder, options));
};

for (const target of targets) {
  const { name, idl } = target;
  console.log(`Generating client for ${name}...`);
  generateClient(name, idl);
}
