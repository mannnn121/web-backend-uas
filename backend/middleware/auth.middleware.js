import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/auth.js";

export const authenticate = (req, res, next) => {
	const authHeader = req.headers.authorization;
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice("Bearer ".length)
		: null;

	if (!token) {
		return res.status(401).json({ error: "Authentication token is required" });
	}

	try {
		req.user = jwt.verify(token, jwtSecret);
		next();
	} catch {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
};

export const authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({ error: "Access denied" });
		}

		next();
	};
};
