FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

RUN cat > /app/entrypoint.sh <<'EOF'
#!/bin/sh
set -e

echo "=== Starting bolaov2 ==="
echo "Running database migrations..."
node scripts/db-migrate.mjs

echo "Starting Next.js server..."
exec node server.js
EOF

RUN chmod +x /app/entrypoint.sh \
  && chown nextjs:nodejs /app/entrypoint.sh

USER nextjs

EXPOSE 3000

CMD ["/bin/sh", "/app/entrypoint.sh"]
