import { PrismaClient } from "@prisma/client";

import { env } from "../env.mjs";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({ log: ["error"] });

if (env.NODE_ENV !== "production") global.prisma = prisma;
