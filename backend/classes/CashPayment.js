import { Payment } from "./Payment.js";

export class CashPayment extends Payment {
	toOrderData() {
		return {
			...super.toOrderData(),
			payment_method: "cash",
			change_amount: this.paidAmount - this.totalPrice,
			payment_reference: null,
		};
	}
}
