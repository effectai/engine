import fs from 'node:fs';

const target = "target/idl/effect_staking.json";

function generateTypescriptObject(jsonObject: any, objectName: string) {
    const tsObject = JSON.stringify(jsonObject, null, 2); // Format the JSON with indentation
    return `export const ${objectName} = ${tsObject} as const;\n`;
}

function readJsonFile(filePath: string) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading or parsing the JSON file:', error);
      return null;
    }
  }

const idl = readJsonFile(target);

if (idl) {
    const tsObject = generateTypescriptObject(idl, 'stakingIdl');
    fs.writeFileSync('constants/staking-idl.ts', tsObject);
}