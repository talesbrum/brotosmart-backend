# backend/Dockerfile
# Build multi-stage: dev com nodemon, prod otimizado

# ── Estágio base ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# Gera Prisma Client
RUN npx prisma generate --schema src/models/schema.prisma

# ── Estágio de desenvolvimento ────────────────────────────────────────────
FROM base AS development
RUN npm install  # instala devDependencies também
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Estágio de produção ───────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
EXPOSE 3000

# Aguarda o banco estar pronto antes de migrar e iniciar
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
