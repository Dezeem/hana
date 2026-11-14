# ─────────────────────────────────────────────────────────────
#  Hana · multi-stage image
#  Final image runs the Next.js standalone server on Node 24 LTS,
#  with the SQLite database and uploaded covers on a volume.
# ─────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd -r hana \
 && useradd -r -g hana -m hana \
 && mkdir -p /app/data \
 && chown -R hana:hana /app

COPY --from=builder --chown=hana:hana /app/public ./public
COPY --from=builder --chown=hana:hana /app/.next/standalone ./
COPY --from=builder --chown=hana:hana /app/.next/static ./.next/static

USER hana
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
