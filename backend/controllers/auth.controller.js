import { loginService } from "../services/auth.service.js";

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: User role is not allowed to login
 */
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const result = await loginService(email, password);

		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};
