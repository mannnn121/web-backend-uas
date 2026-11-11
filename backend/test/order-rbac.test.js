import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/auth.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";
import orderRoute from "../routes/order.route.js";

describe("DELETE /orders/:id authorization (RBAC)", () => {
	let server;
	let baseUrl;

	const cashierToken = jwt.sign(
		{ id: 2, email: "cashier@pos.test", role: "cashier" },
		jwtSecret,
	);

	before(async () => {
		const app = express();
		app.use(express.json());
		app.use("/api/backend", orderRoute);

		await new Promise((resolve) => {
			server = app.listen(0, () => {
				const port = server.address().port;
				baseUrl = `http://127.0.0.1:${port}/api/backend`;
				resolve();
			});
		});
	});

	after(async () => {
		if (server) {
			await new Promise((resolve) => server.close(resolve));
		}
	});

	it("configures authorizeRoles('admin') on DELETE /orders/:id route", () => {
		const deleteLayer = orderRoute.stack.find(
			(layer) =>
				layer.route?.path === "/orders/:id" && layer.route?.methods?.delete,
		);

		assert.ok(deleteLayer, "DELETE /orders/:id route must be defined");
		assert.equal(
			deleteLayer.route.stack.length,
			2,
			"Route must have 2 handlers: authorizeRoles and deleteOrder",
		);
	});

	it("blocks unauthenticated requests with 401", async () => {
		const res = await fetch(`${baseUrl}/orders/30001`, {
			method: "DELETE",
		});

		assert.equal(res.status, 401);
		const body = await res.json();
		assert.deepEqual(body, { error: "Authentication token is required" });
	});

	it("blocks cashier from calling DELETE /orders/30001 with 403 Access denied", async () => {
		const res = await fetch(`${baseUrl}/orders/30001`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${cashierToken}`,
			},
		});

		assert.equal(res.status, 403);
		const body = await res.json();
		assert.deepEqual(body, { error: "Access denied" });
	});

	it("rejects non-admin role in authorizeRoles middleware", () => {
		const middleware = authorizeRoles("admin");
		let statusCode = null;
		let jsonBody = null;
		let nextCalled = false;

		const req = { user: { id: 2, role: "cashier" } };
		const res = {
			status(code) {
				statusCode = code;
				return this;
			},
			json(data) {
				jsonBody = data;
				return this;
			},
		};

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(statusCode, 403);
		assert.deepEqual(jsonBody, { error: "Access denied" });
		assert.equal(nextCalled, false);
	});

	it("allows admin role in authorizeRoles middleware to proceed to next()", () => {
		const middleware = authorizeRoles("admin");
		let nextCalled = false;

		const req = { user: { id: 1, role: "admin" } };
		const res = {};

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(nextCalled, true);
	});
});
