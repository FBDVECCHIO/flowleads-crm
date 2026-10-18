import fs from "node:fs";
import path from "node:path";
import { put, head, get } from "@vercel/blob";

const BLOB_DB_PATH = "db/dev.db";
const LOCAL_DB_PATH = path.join("/tmp", "dev.db");

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let lastSyncedEtag: string | null = null;
let lastCheckedAt = 0;
let syncInProgress = false;

function cleanEtag(etag?: string | null): string {
  if (!etag) return "";
  return etag.replace(/^W\//, "").replace(/"/g, "").trim();
}

function isServerless(): boolean {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return false;
  }
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function hasBlobAccess(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

function cleanupWal(dbPath: string) {
  try {
    if (fs.existsSync(dbPath + "-wal")) fs.unlinkSync(dbPath + "-wal");
    if (fs.existsSync(dbPath + "-shm")) fs.unlinkSync(dbPath + "-shm");
  } catch {}
}

async function downloadFromBlob(tmpDbPath: string): Promise<boolean> {
  if (!hasBlobAccess()) return false;
  try {
    const res = await get(BLOB_DB_PATH, { access: "public" }).catch(() => null);
    if (!res || res.statusCode !== 200 || !res.stream) {
      return false;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of res.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length > 0) {
      cleanupWal(tmpDbPath);
      fs.writeFileSync(tmpDbPath, buffer);
      lastSyncedEtag = cleanEtag(res.blob.etag);
      lastCheckedAt = Date.now();
      return true;
    }
  } catch (e) {
    console.warn("[dbSync] Error downloading SQLite database from Blob:", e);
  }
  return false;
}

/**
 * Ensures the SQLite database in /tmp/dev.db is initialized and synchronized
 * with the authoritative version in Vercel Blob (if running in Serverless).
 */
export async function ensureDatabaseReady(): Promise<string> {
  if (!isServerless()) {
    return process.env.DATABASE_URL || "file:./dev.db";
  }

  const tmpDbPath = LOCAL_DB_PATH;

  // 1. Cold start initialization: run once per container instance
  if (!isInitialized) {
    if (!initPromise) {
      initPromise = (async () => {
        let downloaded = false;
        if (hasBlobAccess()) {
          downloaded = await downloadFromBlob(tmpDbPath);
        }

        // Fallback if not in blob: copy bundled seed database
        if (!downloaded && !fs.existsSync(tmpDbPath)) {
          const candidates = [
            path.join(process.cwd(), "prisma", "dev.db"),
            path.join(process.cwd(), "dev.db"),
            path.join("/var/task", "prisma", "dev.db"),
            path.join("/var/task", "dev.db"),
          ];
          for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
              try {
                cleanupWal(tmpDbPath);
                fs.copyFileSync(candidate, tmpDbPath);
                break;
              } catch (e) {
                console.error("[dbSync] Failed to copy seed SQLite database to /tmp:", e);
              }
            }
          }
        }

        // Guarantee file exists so Prisma doesn't crash
        if (!fs.existsSync(tmpDbPath)) {
          try {
            fs.writeFileSync(tmpDbPath, "");
          } catch {}
        }

        isInitialized = true;
      })();
    }
    await initPromise;
    return `file:${tmpDbPath}`;
  }

  // 2. Warm container: check if remote blob was updated by another container (debounced every 2.5s)
  if (hasBlobAccess() && !syncInProgress) {
    const now = Date.now();
    if (now - lastCheckedAt >= 2500) {
      lastCheckedAt = now;
      try {
        const blobInfo = await head(BLOB_DB_PATH).catch(() => null);
        if (blobInfo?.etag) {
          const remoteEtag = cleanEtag(blobInfo.etag);
          if (remoteEtag && remoteEtag !== lastSyncedEtag) {
            await downloadFromBlob(tmpDbPath);
          }
        }
      } catch {}
    }
  }

  return `file:${tmpDbPath}`;
}

/**
 * Uploads the active /tmp/dev.db to Vercel Blob storage so all subsequent
 * lambda container invocations share the latest database state.
 */
export async function persistDatabase(): Promise<void> {
  if (!isServerless() || !hasBlobAccess()) {
    return;
  }

  const tmpDbPath = LOCAL_DB_PATH;
  if (!fs.existsSync(tmpDbPath)) return;

  syncInProgress = true;
  try {
    try {
      const { prisma } = await import("./prisma.ts");
      await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE);").catch(() => {});
    } catch {}

    const fileBuffer = fs.readFileSync(tmpDbPath);
    if (fileBuffer.length > 0) {
      const result = await put(BLOB_DB_PATH, fileBuffer, {
        access: "public",
        addRandomSuffix: false,
      });
      lastSyncedEtag = cleanEtag(result.pathname ? (await head(BLOB_DB_PATH).catch(() => null))?.etag : null);
      lastCheckedAt = Date.now();
      isInitialized = true;
    }
  } catch (err) {
    console.error("[dbSync] Failed to persist SQLite database to Vercel Blob:", err);
  } finally {
    syncInProgress = false;
  }
}
