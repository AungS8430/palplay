// lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: any;
}

const globalForPrisma = globalThis as any;

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { PrismaClient } = require("@prisma/client");

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ['warn', 'error']
      : ['error'],
  });
};

// Use existing global instance or create a new one
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In non-production environments, store the client on the global object to allow reuse across reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


