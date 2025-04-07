import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { setupLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import orgRoutes from './routes/orgRoutes';
import communicationRoutes from './routes/communicationRoutes';
import projectRoutes from './routes/projectRoutes';
import workplaceRoutes from './routes/workplaceRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { healthCheckMiddleware } from './middleware/healthCheckMiddleware';
import { authMiddleware } from './middleware/authMiddleware';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = setupLogger();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: eval(process.env.RATE_LIMIT_WINDOW_MS as string) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS as string) || 100, // 100 requests per window default
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS handling
app.use(express.json()); // JSON body parsing
app.use(morgan('combined')); // HTTP request logging
app.use(limiter); // Rate limiting
app.use(healthCheckMiddleware); // Health checks for all routes

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/org', authMiddleware, orgRoutes);
app.use('/api/communication', authMiddleware, communicationRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/workplace', authMiddleware, workplaceRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`API Gateway running on port ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason, promise });
  process.exit(1);
});

export default app;
