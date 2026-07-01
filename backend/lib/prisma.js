import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL
	? new URL(process.env.DATABASE_URL)
	: null;

console.log("[prisma] DATABASE_URL set:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL && !process.env.DATABASE_HOST) {
	console.error("[prisma] DATABASE_URL not set — please add it to Railway environment variables");
	throw new Error("Missing DATABASE_URL environment variable");
}

const databaseConfig = {
	host: process.env.DATABASE_HOST || databaseUrl?.hostname || "localhost",
	port: Number(process.env.DATABASE_PORT || databaseUrl?.port || 3306),
	user: process.env.DATABASE_USER || databaseUrl?.username || "root",
	password: process.env.DATABASE_PASSWORD || databaseUrl?.password || "",
	database:
		process.env.DATABASE_NAME ||
		databaseUrl?.pathname.replace("/", "") ||
		"pos_db",
	connectionLimit: 5,
};

console.log("[prisma] connecting to:", databaseConfig.host, databaseConfig.port, databaseConfig.database);

// this config was intended for the url that has ssl strict params
if (
	databaseUrl?.searchParams.get("sslaccept") === "strict" ||
	process.env.DATABASE_SSL === "true"
) {
	databaseConfig.ssl = {
		rejectUnauthorized: false,
	};
}

const adapter = new PrismaMariaDb(databaseConfig);

export const prisma = new PrismaClient({ adapter });
