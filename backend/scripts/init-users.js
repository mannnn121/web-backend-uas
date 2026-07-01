import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

const saltRounds = 10;

const defaultUsers = [
	{
		name: "Admin",
		email: "admin@pos.test",
		password: "admin123",
		role: "admin",
	},
	{
		name: "Cashier",
		email: "cashier@pos.test",
		password: "cashier123",
		role: "cashier",
	},
];

const initUsers = async () => {
	for (const defaultUser of defaultUsers) {
		const existingUser = await prisma.users.findFirst({
			where: { email: defaultUser.email },
			select: { id: true, email: true },
		});

		if (existingUser) {
			console.log(`Skipped existing user: ${defaultUser.email}`);
			continue;
		}

		const hashedPassword = await bcrypt.hash(defaultUser.password, saltRounds);

		await prisma.users.create({
			data: {
				name: defaultUser.name,
				email: defaultUser.email,
				password: hashedPassword,
				role: defaultUser.role,
			},
		});

		console.log(`Created user: ${defaultUser.email}`);
	}
};

try {
	await initUsers();
} catch (err) {
	console.error("Failed to initialize users:", err.message);
	process.exitCode = 1;
} finally {
	await prisma.$disconnect();
}
