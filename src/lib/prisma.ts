import { PrismaClient } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / AWS Lambda, root filesystem is read-only. SQLite requires write/locking access in /tmp.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      try {
        fs.mkdirSync(path.dirname(tmpDbPath), { recursive: true });
      } catch {}
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join("/var/task", "prisma", "dev.db"),
        path.join("/var/task", "dev.db"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            break;
          } catch (e) {
            console.error("Failed to copy SQLite database to /tmp:", e);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;