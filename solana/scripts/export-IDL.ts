import fs from "node:fs";

const types = [
  "target/types/effect_staking.ts",
  "target/types/effect_migration.ts",
  "target/types/effect_payment.ts",
  "target/types/effect_vesting.ts",
  "target/types/effect_rewards.ts",
];

const idls = [
  "target/idl/effect_staking.json",
  "target/idl/effect_migration.json",
  "target/idl/effect_payment.json",
  "target/idl/effect_vesting.json",
  "target/idl/effect_rewards.json",
];

const targetFolder = "../packages/idl/src";

for (const type of types) {
  fs.copyFileSync(type, `${targetFolder}/types/${type.split("/")[2]}`);
}

for (const idl of idls) {
  fs.copyFileSync(idl, `${targetFolder}/idl/${idl.split("/")[2]}`);
}

function generateTypescriptObject(jsonObject: any, objectName: string) {
  const tsObject = JSON.stringify(jsonObject, null, 2); // Format the JSON with indentation
  return `export const ${objectName} = ${tsObject} as const;\n`;
}

function readJsonFile(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading or parsing the JSON file:", error);
    return null;
  }
}

for (const idl of idls) {
  const jsonObject = readJsonFile(idl);
  const objectName = idl.split("/")[2].split(".")[0];
  const tsObject = generateTypescriptObject(jsonObject, objectName);
  fs.writeFileSync(`${targetFolder}/constants/${objectName}.ts`, tsObject);
}
