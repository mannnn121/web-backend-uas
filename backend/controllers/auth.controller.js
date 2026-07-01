import { loginService } from "../services/auth.service.js";

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const result = await loginService(email, password);

		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};
