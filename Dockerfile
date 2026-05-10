# backend/Dockerfile
# Build multi-stage: base com prisma generate, prod otimizado

# ── Estágio base (com devDeps para prisma generate) ───────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app
COPY package*.json ./
# Instala TODAS as deps (incluindo devDeps) para poder rodar prisma generate
RUN npm ci
COPY . .
# Gera Prisma Client com binaryTargets para Alpine/linux-musl
RUN npx prisma generate --schema src/models/schema.prisma

# ── Estágio de produção ───────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app
COPY package*.json ./
# Instala apenas dependencias de producao
RUN npm ci --omit=dev
# Copia codigo-fonte
COPY --from=base /app/src ./src
COPY --from=base /app/migrations ./migrations
# Copia o Prisma Client gerado no estagio base
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
# Copia entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
