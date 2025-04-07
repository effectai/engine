import { createHash } from "node:crypto";
import { TaskRecord } from "../stores/taskStore.js";

export const computeTaskId = (
	provider: string,
	template_data: string,
): string => {
	const input = `${provider}:${template_data}`;
	const sha256 = createHash("sha256").update(input).digest("hex");
	return sha256;
};

export const computePaymentId = (payment: {
	recipient: string;
	nonce: bigint;
}): string => {
	const input = `${payment.recipient}:${payment.nonce}`;
	const sha256 = createHash("sha256").update(input).digest("hex");

	return sha256;
};

export const computeTaskProvider = (taskRecord: TaskRecord) => {
	const created = taskRecord.events.find((e) => e.type === "create");
	return created?.provider;
};

export function stringifyWithBigInt(obj: any): string {
	return JSON.stringify(obj, (_, value) =>
		typeof value === "bigint" ? `${value}n` : value,
	);
}

export function parseWithBigInt(json: string): any {
	return JSON.parse(json, (_, value) => {
		if (typeof value === "string" && /^\d+n$/.test(value)) {
			return BigInt(value.slice(0, -1));
		}
		return value;
	});
}
