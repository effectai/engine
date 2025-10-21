export * from "./@generated";
export * from "./consts.js";
export * from "./utils.js";

export type { Groth16Proof } from "snarkjs";
export {
  prove,
  buildEddsa,
  generatePaymentProof,
  signPayment,
  type PublicSignals,
  type SignedPayment,
} from "./zkp.js";
