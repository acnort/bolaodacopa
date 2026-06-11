import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
const migrationsDir = path.resolve(__dirname, "../database/migrations");

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

const client = new Client({
  connectionString,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

try {
  await client.connect();
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await client.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default timezone('utc', now())
    )
  `);

  const appliedResult = await client.query(
    "select version from schema_migrations",
  );
  const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

  if (appliedVersions.size === 0) {
    const existingDatabase = await client.query(`
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'competitions'
      ) as exists
    `);

    if (existingDatabase.rows[0]?.exists) {
      for (const file of migrationFiles) {
        await client.query(
          "insert into schema_migrations (version) values ($1) on conflict do nothing",
          [file],
        );
        appliedVersions.add(file);
      }

      console.log(
        "Banco existente detectado; migrations atuais marcadas como aplicadas.",
      );
    }
  }

  for (const file of migrationFiles) {
    if (appliedVersions.has(file)) {
      console.log(`Migração já aplicada: ${file}`);
      continue;
    }

    const migrationPath = path.resolve(migrationsDir, file);
    const sql = await readFile(migrationPath, "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into schema_migrations (version) values ($1)",
        [file],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
    console.log(`Migração aplicada com sucesso: ${migrationPath}`);
  }
} finally {
  await client.end();
}
