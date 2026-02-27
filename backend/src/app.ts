import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { checkConnection } from './config/database';
import { verifyCloudinaryConfig } from './config/cloudinary';
import { verifyResendConfig } from './config/resend';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://sponsor-story-stream.lovable.app',
  /\.lovable\.app$/,
  /\.lovable\.dev$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now during development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await checkConnection();
  const cloudinaryConfigured = verifyCloudinaryConfig();
  const resendConfigured = verifyResendConfig();
  
  const status = {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      cloudinary: cloudinaryConfigured ? 'configured' : 'not configured',
      resend: resendConfigured ? 'configured' : 'not configured',
    },
  };
  
  res.status(dbConnected ? 200 : 503).json(status);
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Verify database connection
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    // Verify Cloudinary configuration
    if (!verifyCloudinaryConfig()) {
      console.warn('⚠️ Cloudinary not configured - file uploads will fail');
    }
    
    // Verify Resend configuration
    if (!verifyResendConfig()) {
      console.warn('⚠️ Resend not configured - emails will not be sent');
    }
    
    app.listen(PORT, () => {
      console.log(`
🚀 Server running on port ${PORT}
📦 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API URL: http://localhost:${PORT}/api
❤️ Health Check: http://localhost:${PORT}/health
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
