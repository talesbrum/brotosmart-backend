// src/server.js — BrotoSmart API (completo com sistema de premiações)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const { initFirebase }  = require('./config/firebase');
const { connectDB, disconnectDB } = require('./config/database');

const authRoutes    = require('./routes/auth');
const learningRoutes = require('./routes/learning');
const notifRoutes   = require('./routes/notifications');
const rewardsRoutes = require('./routes/rewards');
const deviceRoutes  = require('./routes/devices');

const app  = express();
const PORT = process.env.PORT || 3000;

initFirebase();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', rateLimit({ windowMs: 60_000, max: 100, message: { error: 'Muitas requisições.' } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60_000, max: 10, message: { error: 'Muitas tentativas.' } }));

app.use('/api/auth',    authRoutes);
app.use('/api',         learningRoutes);
app.use('/api',         notifRoutes);
app.use('/api',         rewardsRoutes);
app.use('/api',         deviceRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'BrotoSmart API', version: '2.0.0' }));
// Health check — usado pelo Railway e outros serviços de deploy
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: `Rota ${req.path} não encontrada` }));
app.use((err, _req, res, _next) => { console.error('[Error]', err); res.status(500).json({ error: 'Erro interno' }); });

async function start() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`\n🌱 BrotoSmart API v2.0 → http://localhost:${PORT}\n`);
  });
  process.on('SIGTERM', async () => { server.close(async () => { await disconnectDB(); process.exit(0); }); });
}

start().catch(console.error);
module.exports = app;
