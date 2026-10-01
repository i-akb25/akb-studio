import { PrismaClient } from "@generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalDatabase = globalThis as typeof globalThis & {
  akbPrisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const configured =
    process.env.DATABASE_URL?.trim() ??
    "postgresql://unconfigured:unconfigured@127.0.0.1:5432/unconfigured";
  const url = new URL(configured);
  if (!url.searchParams.has("connect_timeout"))
    url.searchParams.set("connect_timeout", "5");
  const connectionString = url.toString();
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

export const prisma = globalDatabase.akbPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalDatabase.akbPrisma = prisma;
