import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { createFromRoot } from "codama";
import { renderVisitor } from "@codama/renderers-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

//get target from command line args
const args = process.argv.slice(2);
const target = args[0];

const localIdlFolderExists = existsSync(path.join(__dirname, "../../../idls/"));

const idl_folder = localIdlFolderExists
  ? path.join(__dirname, "../../../idls/")
  : path.join(__dirname, "../../idls/");

const loadIdl = (relativePath: string) => {
  return JSON.parse(readFileSync(path.join(idl_folder, relativePath), "utf-8"));
};

export const generateClient = (
  name: string,
  idlPath: string,
  outputPath: string,
) => {
  const idl = loadIdl(idlPath);

  const codama = createFromRoot(rootNodeFromAnchor(idl));
  const pathToGeneratedFolder = path.join(__dirname, outputPath);
  const options = {};
  codama.accept(renderVisitor(pathToGeneratedFolder, options));
};

generateClient(
  target,
  `effect_${target}.json`,
  `../../../modules/${target}/clients/js/@generated`,
);
