import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
const migrationPath = path.resolve(
  __dirname,
  "../database/migrations/202604210001_initial.sql",
);

try {
  const envFile = await readFile(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // Keep running if there is no local .env file.
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL não configurada.");
  process.exit(1);
}

const sql = await readFile(migrationPath, "utf8");

const client = new Client({
  connectionString,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Migração aplicada com sucesso: ${migrationPath}`);
} finally {
  await client.end();
}
