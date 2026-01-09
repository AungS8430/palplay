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
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Use existing global instance or create a new one
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Prevent multiple instances during hot reloading in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown handling for Supabase connection pooling
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

