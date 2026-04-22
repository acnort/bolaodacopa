import "server-only";

import { Pool } from "pg";

import { isDatabaseConfigured } from "@/lib/services/database/shared";

declare global {
  var __bolaoDatabasePool: Pool | undefined;
}

export function getDatabasePool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalThis.__bolaoDatabasePool) {
    globalThis.__bolaoDatabasePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return globalThis.__bolaoDatabasePool;
}
