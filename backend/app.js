import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, anonymousLimiter, telemetryLimiter } from './middleware/security.js';
import { attachRequestContext, requestLogger } from './middleware/observability.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';
import resilienceRoutes from './routes/resilienceRoutes.js';
import anonymousRoutes from './routes/anonymousRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

app.disable('x-powered-by');

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(attachRequestContext);
app.use(requestLogger);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 1000 }));
app.use('/api', apiLimiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    requestId: req.requestId,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/telemetry/frontend-error', telemetryLimiter, (req, res) => {
  const payload = {
    level: 'warn',
    msg: 'frontend_error',
    requestId: req.requestId,
    name: String(req.body?.name || 'Error').slice(0, 120),
    message: String(req.body?.message || 'Unknown client error').slice(0, 1000),
    source: String(req.body?.source || 'frontend').slice(0, 100),
    stack: req.body?.stack ? String(req.body.stack).slice(0, 2000) : undefined,
    href: String(req.body?.href || '').slice(0, 500),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    clientTimestamp: req.body?.timestamp,
    serverTimestamp: new Date().toISOString(),
  };

  console.warn(JSON.stringify(payload));
  res.status(202).json({ success: true, requestId: req.requestId });
});

app.post('/api/telemetry/web-vitals', telemetryLimiter, (req, res) => {
  const payload = {
    level: 'info',
    msg: 'web_vitals',
    requestId: req.requestId,
    metric: String(req.body?.metric || 'unknown').slice(0, 60),
    value: Number(req.body?.value || 0),
    rating: String(req.body?.rating || 'unknown').slice(0, 20),
    href: String(req.body?.href || '').slice(0, 500),
    clientTimestamp: req.body?.timestamp,
    serverTimestamp: new Date().toISOString(),
  };

  console.info(JSON.stringify(payload));
  res.status(202).json({ success: true, requestId: req.requestId });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/resilience', resilienceRoutes);
app.use('/api/anonymous', anonymousLimiter, anonymousRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
