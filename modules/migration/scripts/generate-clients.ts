import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { createFromRoot } from "codama";
import { readFileSync } from "node:fs";
import { renderVisitor } from "@codama/renderers-js";

import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function transformIdl(idl: TransformedIdl): TransformedIdl {
  return {
    ...idl,
    instructions: idl.instructions.map((instruction) => {
      const accounts = instruction.accounts.map((account) => {
        if (
          account.pda?.program?.kind === "account" &&
          account.pda.program.path
        ) {
          // Find the referenced program account
          const programAccount = instruction.accounts.find(
            (acc) => acc.name === account.pda?.program?.path,
          );

          if (programAccount?.address) {
            return {
              ...account,
              pda: {
                ...account.pda,
                program: {
                  kind: "const",
                  value: programAccount.address,
                },
              },
            };
          }
        }
        return account;
      });

      return {
        ...instruction,
        accounts,
      };
    }),
  };
}

const targets = [
  {
    name: "migration",
    idl: "effect_migration.json",
  },
];

const idl_folder = path.join(__dirname, "../../../idls/");
const loadIdl = (relativePath: string) => {
  return JSON.parse(readFileSync(path.join(idl_folder, relativePath), "utf-8"));
};

const generateClient = (name: string, idlPath: string) => {
  const idl = transformIdl(loadIdl(idlPath));

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
