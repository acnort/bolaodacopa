export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function requireDatabaseInProduction() {
  if (process.env.NODE_ENV === "production" && !isDatabaseConfigured()) {
    throw new Error("DATABASE_URL é obrigatória em produção.");
  }
}
