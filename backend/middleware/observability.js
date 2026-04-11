import { randomUUID } from 'crypto';

const MAX_USER_AGENT_LENGTH = 200;

const safeNow = () => Number(process.hrtime.bigint()) / 1e6;

export const attachRequestContext = (req, res, next) => {
  req.requestId = randomUUID();
  req.requestStartMs = safeNow();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

export const requestLogger = (req, res, next) => {
  res.on('finish', () => {
    const durationMs = Math.round((safeNow() - (req.requestStartMs || safeNow())) * 100) / 100;
    const payload = {
      level: res.statusCode >= 500 ? 'error' : 'info',
      msg: 'http_request',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: (req.headers['user-agent'] || 'unknown').slice(0, MAX_USER_AGENT_LENGTH),
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(payload));
  });

  next();
};
