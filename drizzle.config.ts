import { defineConfig } from "drizzle-kit";

// drizzle-kit auto-loads .env; in CI/deploy pass DATABASE_URL inline:
//   DATABASE_URL="postgres://..." npx drizzle-kit push
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
