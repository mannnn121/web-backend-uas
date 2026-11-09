import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTodayRange } from "../lib/report-range.js";

describe("getTodayRange (WIB, UTC+7)", () => {
	it("uses the WIB date late in the UTC day", () => {
		const { date, start, end } = getTodayRange(
			new Date("2026-11-09T20:00:00Z"),
		);

		assert.equal(date, "2026-11-10");
		assert.equal(start.toISOString(), "2026-11-09T17:00:00.000Z");
		assert.equal(end.toISOString(), "2026-11-10T17:00:00.000Z");
	});

	it("uses the same WIB date early in the UTC day", () => {
		const { date, start } = getTodayRange(new Date("2026-11-09T03:00:00Z"));

		assert.equal(date, "2026-11-09");
		assert.equal(start.toISOString(), "2026-11-08T17:00:00.000Z");
	});

	it("does not depend on the server time zone", () => {
		const { date } = getTodayRange(new Date("2026-11-09T16:59:59Z"));

		assert.equal(date, "2026-11-09");
	});
});
