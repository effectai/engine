import type { Payment } from "../../../../common/proto/effect.js";
import type { ActionHandler } from "../../../../common/router.js";
import type { WorkerPaymentService } from "../service.js";

export class GetPaymentsAction implements ActionHandler<void, Payment[]> {
	constructor(private paymentService: WorkerPaymentService) {}

	async execute(): Promise<Payment[]> {
		try {
			return await this.paymentService.getPayments();
		} catch (e) {
			console.error(e);
			return [];
		}
	}
}
