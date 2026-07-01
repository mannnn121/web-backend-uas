import { Payment } from "./Payment.js";

export class QrisPayment extends Payment {
	constructor({ paidAmount, totalPrice, paymentReference }) {
		super({ paidAmount, totalPrice });
		this.paymentReference = paymentReference;

		if (this.paidAmount !== this.totalPrice) {
			throw new Error("QRIS paid amount must match total price");
		}

		if (!this.paymentReference?.trim()) {
			throw new Error("QRIS payment reference is required");
		}
	}

	toOrderData() {
		return {
			...super.toOrderData(),
			payment_method: "qris",
			change_amount: 0,
			payment_reference: this.paymentReference.trim(),
		};
	}
}
