import { PrismaClient } from "./generated/client";

const globalForPrisma = globalThis as unknown as {
  candyPrisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.candyPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.candyPrisma = prisma;
}

export { PrismaClient, Prisma } from "./generated/client";
export default prisma;
