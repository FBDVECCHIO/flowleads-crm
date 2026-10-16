import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const PROJECT_ROOT = path.resolve(process.cwd());
export const SRC_DIR = path.join(PROJECT_ROOT, "src");

/**
 * Dynamically import a module, returning null if the module or file does not exist yet.
 */
export async function loadModule<T = any>(relativeModulePath: string): Promise<T | null> {
  const fullPath = path.resolve(PROJECT_ROOT, relativeModulePath);
  if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath + ".ts") && !fs.existsSync(fullPath + ".tsx")) {
    return null;
  }
  try {
    const mod = await import(`file://${fullPath.replace(/\\/g, "/")}`);
    return mod as T;
  } catch (err) {
    return null;
  }
}

/**
 * Read all text files recursively in a directory.
 */
export function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== ".next") {
        getAllFiles(fullPath, fileList);
      }
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Generate HMAC-SHA256 signature in Meta's format: "sha256=<hex>"
 */
export function generateMetaSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `sha256=${hmac}`;
}

/**
 * Reference implementation of anti-session hijacking HMAC token
 */
export function createMockSessionToken(payload: any, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Helper to compute SHA-256 fingerprint of User-Agent
 */
export function computeUserAgentFingerprint(userAgent: string): string {
  return crypto.createHash("sha256").update(userAgent || "").digest("hex");
}

/**
 * Create a mock valid PDF file buffer with standard magic bytes %PDF-1.4
 */
export function createValidPdfBuffer(content = "Sample Medical Prescription"): Buffer {
  const header = Buffer.from("%PDF-1.4\n%âãÏÓ\n");
  const body = Buffer.from(`1 0 obj\n<< /Title (${content}) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`);
  return Buffer.concat([header, body]);
}

/**
 * Create a mock valid PNG file buffer with magic bytes \x89PNG\r\n\x1a\n
 */
export function createValidPngBuffer(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
}

/**
 * Create a mock valid JPEG file buffer with magic bytes \xFF\xD8\xFF
 */
export function createValidJpegBuffer(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
}

/**
 * Create an executable binary payload with MZ header
 */
export function createMaliciousExeBuffer(): Buffer {
  return Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff]);
}

/**
 * Create a script payload disguised as document
 */
export function createMaliciousScriptBuffer(): Buffer {
  return Buffer.from("#!/bin/bash\nrm -rf / --no-preserve-root\necho 'hacked'");
}
