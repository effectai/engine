import type { CommandModule } from "yargs";
import { createPaymentPool } from "./create";

export const PaymentCommands: CommandModule = {
	command: "payments <command>",
	describe: "commafnds for managing payments",
	builder: (yargs) => yargs.command(createPaymentPool),
	handler: () => {
		// This should never be called
		console.error("Please provide a valid command");
	},
};
