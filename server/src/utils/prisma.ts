import { PrismaClient } from "../generated/client/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

