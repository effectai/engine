import { Command } from "commander";
import { registerCheckPayoutCommand } from "./check-payout.js";
import { registerCreatePaymentPoolCommand } from "./create.js";

export const paymentsProgram = new Command();

paymentsProgram
  .name("payments")
  .description("CLI for interacting with the payments program");

registerCreatePaymentPoolCommand(paymentsProgram);
registerCheckPayoutCommand(paymentsProgram);
