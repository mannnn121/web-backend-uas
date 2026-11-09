FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package*.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts \
    && DATABASE_URL="mysql://build:build@localhost:3306/build" npx prisma generate

COPY --chown=node:node . .

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD node -e "fetch('http://localhost:3000/api/backend/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node app.js"]
