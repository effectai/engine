import { pino } from "pino";

export const logger = pino({
	level: "info",
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true, // Enable colors
			translateTime: "HH:MM:ss", // Human-readable time
			ignore: "pid,hostname", // Remove unnecessary fields
		},
	},
});
