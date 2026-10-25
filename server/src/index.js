import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import apiRoutes from './routes.js';

const { Pool } = pg;
const app = express();
const port = Number.parseInt(process.env.PORT || '4000', 10);

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server and local health checks with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on('error', (error) => console.error('Unexpected idle PostgreSQL client error:', error.message));
}
app.locals.db = pool;

app.get('/', (_req, res) => res.json({ name: 'Afrolivestream API', version: '0.1.0', docs: '/api/health' }));
app.use('/api', apiRoutes);
app.use((_req, res) => res.status(404).json({ error: 'not_found', message: 'Endpoint not found.' }));
app.use((error, _req, res, _next) => {
  if (error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }
  console.error('Request failed:', error.message);
  return res.status(500).json({ error: 'internal_error', message: 'The request could not be completed.' });
});

const server = app.listen(port, () => {
  console.log(`Afrolivestream API listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    if (pool) await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
