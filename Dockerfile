# Navo Plus website. Built with Next.js standalone output (see next.config.ts).
# Runtime env: NAVO_API_URL, NAVO_API_KEY. Listens on 3000.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm on Windows can leave Linux-only optional deps out of the lockfile (npm bug);
# fall back to a normal install rather than failing the deploy.
RUN npm ci --no-audit --no-fund || \
    (echo "WARNING: package-lock.json out of sync for Linux; using npm install" && npm install --no-audit --no-fund)

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
