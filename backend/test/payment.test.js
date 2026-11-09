import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CashPayment } from "../classes/CashPayment.js";
import { Payment } from "../classes/Payment.js";
import { QrisPayment } from "../classes/QrisPayment.js";

describe("Payment", () => {
	it("rejects a paid amount lower than the total", () => {
		assert.throws(
			() => new Payment({ paidAmount: 5000, totalPrice: 10000 }),
			/cannot be lower/,
		);
	});

	it("rejects a negative or non-numeric paid amount", () => {
		assert.throws(() => new Payment({ paidAmount: -1, totalPrice: 0 }));
		assert.throws(() => new Payment({ paidAmount: "abc", totalPrice: 0 }));
	});

	it("accepts numeric strings", () => {
		const payment = new Payment({ paidAmount: "15000", totalPrice: "15000" });
		assert.equal(payment.paidAmount, 15000);
	});
});

describe("CashPayment", () => {
	it("calculates change", () => {
		const data = new CashPayment({
			paidAmount: 50000,
			totalPrice: 32000,
		}).toOrderData();

		assert.deepEqual(data, {
			paid_amount: 50000,
			payment_status: "paid",
			payment_method: "cash",
			change_amount: 18000,
			payment_reference: null,
		});
	});

	it("gives zero change for an exact amount", () => {
		const data = new CashPayment({
			paidAmount: 20000,
			totalPrice: 20000,
		}).toOrderData();

		assert.equal(data.change_amount, 0);
	});
});

describe("QrisPayment", () => {
	it("requires the exact total", () => {
		assert.throws(
			() =>
				new QrisPayment({
					paidAmount: 30000,
					totalPrice: 25000,
					paymentReference: "REF-1",
				}),
			/must match total/,
		);
	});

	it("requires a payment reference", () => {
		assert.throws(
			() =>
				new QrisPayment({
					paidAmount: 25000,
					totalPrice: 25000,
					paymentReference: "   ",
				}),
			/reference is required/,
		);
	});

	it("returns order data with a trimmed reference and no change", () => {
		const data = new QrisPayment({
			paidAmount: 25000,
			totalPrice: 25000,
			paymentReference: "  QRIS-123  ",
		}).toOrderData();

		assert.equal(data.payment_method, "qris");
		assert.equal(data.payment_reference, "QRIS-123");
		assert.equal(data.change_amount, 0);
	});
});
