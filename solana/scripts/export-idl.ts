//preprocesses idls & exports them to idl folder
import fs from "node:fs";
import path from "node:path";

function transformIdl(idl: TransformedIdl): TransformedIdl {
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

const idlDir = path.join(__dirname, "./../target/idl/");
const main = () => {
  const files = fs.readdirSync(idlDir);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const transformedIdls = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(idlDir, file);
      const data = fs.readFileSync(filePath, "utf8");
      const idl = JSON.parse(data);

      const transformed = transformIdl(idl);
      transformedIdls.push(transformed);

      fs.writeFileSync(
        path.join(__dirname, "./../idls", file),
        JSON.stringify(transformed, null, 2),
      );
    } catch (error) {
      console.error(`Error loading IDL from ${file}:`, error);
    }
  }
};

main();
