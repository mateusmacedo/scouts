import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createComposedLogger, createRedactor } from '@scouts/logger-node';
import { correlationIdMiddleware } from './middleware/correlation-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { notificationRoutes } from './routes/notifications.routes';
import { healthRoutes } from './routes/health.routes';

// Configuração do logger composto (demonstração de uso direto do logger-node)
const logger = createComposedLogger({
  enableMetrics: true,
  redactor: createRedactor({
    keys: ['password', 'token', 'email', 'phone', 'ssn', 'cardNumber']
  }),
  sinkOptions: {
    service: 'express-notifier',
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0'
  }
});

const app = express();
const PORT = process.env['PORT'] || 3001;

// Middlewares de segurança e performance
app.use(helmet());
app.use(compression() as any);
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middlewares customizados com logger
app.use(correlationIdMiddleware(logger));
app.use(requestLoggerMiddleware(logger));

// Routes
app.use('/api/v1/notifications', notificationRoutes);
app.use('/health', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'express-notifier',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handler (deve ser o último middleware)
app.use(errorHandlerMiddleware(logger));

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info('Express Notifier started', { 
    port: PORT,
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0'
  });
});

export default app;
