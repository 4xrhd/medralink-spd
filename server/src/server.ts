import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initDb } from './db/database.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded lab report files
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// System Health Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'MedraLink EMR REST API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount Versioned REST API Router
app.use('/api/v1', apiRouter);

// Global Error Handler Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Bootstrap server if started directly
if (process.env.NODE_ENV !== 'test') {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🏥 MedraLink EMR Backend Server running on Port ${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  }).catch((err) => {
    console.error('Database initialization failed:', err);
  });
}
