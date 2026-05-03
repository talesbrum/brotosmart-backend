// src/config/database.js
// Singleton do Prisma Client

const { PrismaClient } = require('@prisma/client');

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }
  return prisma;
}

async function connectDB() {
  const client = getPrisma();
  await client.$connect();
  console.log('✅ PostgreSQL conectado via Prisma');
  return client;
}

async function disconnectDB() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('PostgreSQL desconectado');
  }
}

module.exports = { getPrisma, connectDB, disconnectDB };
