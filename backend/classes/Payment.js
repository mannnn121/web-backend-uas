export class Payment {
	constructor({ paidAmount, totalPrice }) {
		this.paidAmount = Number(paidAmount);
		this.totalPrice = Number(totalPrice);

		if (!Number.isFinite(this.paidAmount) || this.paidAmount < 0) {
			throw new Error("Paid amount must be a valid positive number");
		}

		if (this.paidAmount < this.totalPrice) {
			throw new Error("Paid amount cannot be lower than total price");
		}
	}

	toOrderData() {
		return {
			paid_amount: this.paidAmount,
			payment_status: "paid",
		};
	}
}
