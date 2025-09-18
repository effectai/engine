import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { createFromRoot } from "codama";
import { renderVisitor } from "@codama/renderers-js";

const isMainnet = process.argv.includes("--mainnet");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targets = [
  {
    name: "migration",
    idl: isMainnet ? "effect_migration.json" : "effect_migration_localnet.json",
  },
  {
    name: "stake",
    idl: isMainnet ? "effect_staking.json" : "effect_staking_localnet.json",
  },
  {
    name: "reward",
    idl: isMainnet ? "effect_rewards.json" : "effect_rewards_localnet.json",
  },
  {
    name: "vesting",
    idl: isMainnet ? "effect_vesting.json" : "effect_vesting_localnet.json",
  },
  {
    name: "payment",
    idl: isMainnet ? "effect_payment.json" : "effect_payment_localnet.json",
  },
];

const idl_folder = path.join(__dirname, "../../../idls/");
const loadIdl = (relativePath: string) => {
  return JSON.parse(readFileSync(path.join(idl_folder, relativePath), "utf-8"));
};

const generateClient = (name: string, idlPath: string, outputPath: string) => {
  const idl = loadIdl(idlPath);

  const codama = createFromRoot(rootNodeFromAnchor(idl));
  const pathToGeneratedFolder = path.join(__dirname, outputPath);
  const options = {};
  codama.accept(renderVisitor(pathToGeneratedFolder, options));
};

for (const target of targets) {
  const { name, idl } = target;
  generateClient(name, idl, `../../../modules/${name}/clients/js/@generated`);
}
