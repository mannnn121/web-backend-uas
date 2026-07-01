import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/auth.js";
import { prisma } from "../lib/prisma.js";

const allowedRoles = ["admin", "cashier"];

const sanitizeUser = (user) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
});

export const loginService = async (email, password) => {
	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		!email.trim() ||
		!password
	) {
		const error = new Error("Email and password are required");
		error.statusCode = 400;
		throw error;
	}

	const user = await prisma.users.findFirst({
		where: { email: email.trim() },
		select: {
			id: true,
			name: true,
			email: true,
			password: true,
			role: true,
		},
	});

	const isPasswordValid = user && typeof user.password === "string"
		? await bcrypt.compare(password, user.password)
		: false;

	if (!user || !isPasswordValid) {
		const error = new Error("Invalid email or password");
		error.statusCode = 401;
		throw error;
	}

	if (!allowedRoles.includes(user.role)) {
		const error = new Error("User role is not allowed to login");
		error.statusCode = 403;
		throw error;
	}

	const token = jwt.sign(
		{
			id: user.id,
			email: user.email,
			role: user.role,
		},
		jwtSecret,
		{ expiresIn: "1d" },
	);

	return {
		message: "Login successful",
		token,
		user: sanitizeUser(user),
	};
};
