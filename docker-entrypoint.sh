#!/bin/sh
# docker-entrypoint.sh — roda migrations e seed antes de iniciar a API

set -e

echo "🌱 BrotoSmart API — iniciando..."
echo "   Rodando migrations do Prisma..."

npx prisma migrate deploy --schema src/models/schema.prisma

echo "   Migrations aplicadas com sucesso!"
echo "   Iniciando servidor..."

exec "$@"
