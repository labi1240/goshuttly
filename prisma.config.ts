import "dotenv/config";
import { defineConfig } from "@prisma/config";

// DATABASE_URL is the direct postgres:// connection used by both Prisma Migrate
// (here) and the runtime PrismaClient via @prisma/adapter-pg in lib/prisma.ts.
// DIRECT_URL is kept as an alias for tooling that expects it; either resolves.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
