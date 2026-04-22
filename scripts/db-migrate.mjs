import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL não configurada.");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationPath = path.resolve(
  __dirname,
  "../database/migrations/202604210001_initial.sql",
);

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
