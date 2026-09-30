import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initDb, pingDb, closeDb } from './db/database.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Security Headers with relaxed CSP to permit SPA assets & styles
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
            connectSrc: ["'self'", '*'],
          },
        }
      : false,
  })
);

// Compression Middleware for Gzip/Deflate
app.use(compression());

// HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(isProd ? 'combined' : 'dev'));
}

// Configurable CORS Policy
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to permissive for public prototype endpoints
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Global Rate Limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX || 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// Stricter Rate Limiter for Authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 50),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded lab report files
const uploadsPath = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// System Health & Liveness Endpoints
app.get(['/health', '/api/health'], async (_req: Request, res: Response) => {
  const dbHealth = await pingDb();
  const isHealthy = dbHealth.ok;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'MedraLink EMR Management Platform',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbHealth,
    memoryUsage: {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    version: '1.0.0',
  });
});

// Apply rate limiters
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter);

// Mount Versioned REST API Router
app.use('/api/v1', apiRouter);

// Resolve compiled SPA client static bundle
function findClientDist(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../public'),
    path.resolve(process.cwd(), 'public'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return null;
}

const clientDist = findClientDist();
if (clientDist) {
  console.log(`[STATIC] Serving compiled frontend from: ${clientDist}`);
  app.use(express.static(clientDist));

  // SPA fallback for HTML5 History API (client-side routing)
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
});

// Bootstrap server if started directly
if (process.env.NODE_ENV !== 'test') {
  initDb()
    .then(async () => {
      if (process.env.AUTO_SEED === 'true') {
        try {
          console.log('[AUTO-SEED] AUTO_SEED=true detected. Checking initial seed state...');
          const { seedDatabase } = await import('./db/seed.js');
          await seedDatabase();
        } catch (seedErr) {
          console.error('[AUTO-SEED] Error seeding database:', seedErr);
        }
      }

      const server = app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🏥 MedraLink EMR Server active on Port ${PORT}`);
        console.log(`📡 API Base:        http://localhost:${PORT}/api/v1`);
        console.log(`🩺 Health Check:    http://localhost:${PORT}/api/health`);
        if (clientDist) {
          console.log(`🌐 Frontend UI:     http://localhost:${PORT}/`);
        }
        console.log(`====================================================`);
      });

      // Graceful Shutdown Handler
      const shutdown = async (signal: string) => {
        console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP listener gracefully...`);
        server.close(async () => {
          console.log('[SHUTDOWN] HTTP listener closed.');
          try {
            await closeDb();
            console.log('[SHUTDOWN] Database connections released.');
            process.exit(0);
          } catch (dbErr) {
            console.error('[SHUTDOWN] Error closing database connections:', dbErr);
            process.exit(1);
          }
        });

        // Force shutdown if connections do not close in 10s
        setTimeout(() => {
          console.error('[SHUTDOWN] Forced shutdown initiated due to timeout.');
          process.exit(1);
        }, 10000).unref();
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
    });
}
