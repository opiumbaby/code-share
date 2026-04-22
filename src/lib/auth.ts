import "dotenv/config";
import { Pool } from "pg";
import { betterAuth } from "better-auth";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3001"],
  advanced: {
    defaultCookieAttributes: {
      path: "/",
    },
  },
});
