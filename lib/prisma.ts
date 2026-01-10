// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ['warn', 'error']
      : ['error'],
  });
};

// Use existing global instance or create a new one
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In non-production environments, store the client on the global object to allow reuse across reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


