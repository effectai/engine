import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";

const SNARKJS = "node ./node_modules/snarkjs/cli.js";
const CIRCOM = "circom";
const CIRCUIT = "PaymentBatch";
const TAU_SIZE = 17;
const BASE = ".";

const CIRCUIT_DIR = `${BASE}/circuits`;
const CIRCUIT_OUT_DIR = `${CIRCUIT_DIR}/build`;
const SETUP_DIR = `${CIRCUIT_OUT_DIR}/setup`;
const PTAU_FINAL = `${SETUP_DIR}/pot${TAU_SIZE}_final.ptau`;
const R1CS_FILE = `${CIRCUIT_OUT_DIR}/${CIRCUIT}.r1cs`;
const ZKEY_FILE = `${CIRCUIT_OUT_DIR}/${CIRCUIT}_0001.zkey`;
const VKEY_FILE = `${CIRCUIT_OUT_DIR}/${CIRCUIT}_verification.json`;

function run(cmd: string) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function compileCircuit() {
  //create output directory if it doesn't exist
  ensureDir(CIRCUIT_OUT_DIR);

  run(
    `${CIRCOM} ${CIRCUIT_DIR}/${CIRCUIT}.circom --r1cs --wasm --output ${CIRCUIT_OUT_DIR}`,
  );
}

function phase1() {
  ensureDir(SETUP_DIR);

  // if the final ptau already exists, skip phase 1
  if (existsSync(PTAU_FINAL)) {
    console.log("✅ Phase 1 already completed. Skipping...");
    return;
  }

  const pot0000 = `${SETUP_DIR}/pot${TAU_SIZE}_0000.ptau`;
  const pot0001 = `${SETUP_DIR}/pot${TAU_SIZE}_0001.ptau`;

  run(`${SNARKJS} powersoftau new bn128 ${TAU_SIZE} ${pot0000} -v`);
  run(
    `${SNARKJS} powersoftau contribute ${pot0000} ${pot0001} --name="Second" -v -e="random text"`,
  );
  run(`${SNARKJS} powersoftau prepare phase2 ${pot0001} ${PTAU_FINAL} -v`);

  rmSync(pot0000);
  rmSync(pot0001);
}

function phase2() {
  const zkey0 = `${CIRCUIT}_0000.zkey`;
  const zkey1 = `${CIRCUIT}_0001.zkey`;

  run(`${SNARKJS} groth16 setup ${R1CS_FILE} ${PTAU_FINAL} ${zkey0}`);
  run(
    `${SNARKJS} zkey contribute ${zkey0} ${zkey1} --name="First" -v -e="random"`,
  );

  rmSync(zkey0);
  run(`mv ${zkey1} ${ZKEY_FILE}`);
}

function exportVkey() {
  run(
    `${SNARKJS} zkey export verificationkey ${ZKEY_FILE} ${CIRCUIT}_verification.json`,
  );
  run(`mv ${CIRCUIT}_verification.json ${VKEY_FILE}`);
}

async function main() {
  compileCircuit();
  phase1();
  phase2();
  exportVkey();
  console.log("\n✅ ZKP setup complete.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
