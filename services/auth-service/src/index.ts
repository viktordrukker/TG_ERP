import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { sequelize } from './models';
import { setupMessageBroker } from './events/messageBroker';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import iamRoutes from './routes/iamRoutes';
import { setupLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = setupLogger();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/iam', iamRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Telegram bot
let bot: Telegraf | null = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  
  // Bot commands
  bot.command('start', (ctx) => {
    ctx.reply('Welcome to TG_ERP Auth Service Bot! Use /register to create a new account.');
  });
  
  bot.command('register', (ctx) => {
    const telegramId = ctx.from.id.toString();
    ctx.reply(`Your Telegram ID is: ${telegramId}. Use this ID to register at our service.`);
  });
  
  // Start bot
  bot.launch().then(() => {
    logger.info('Telegram bot started successfully');
  }).catch((error) => {
    logger.error('Failed to start Telegram bot', { error });
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
} else {
  logger.warn('TELEGRAM_BOT_TOKEN not provided. Bot functionality disabled.');
}

// Connect to database and start server
async function startServer() {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
    
    // Connect to message broker
    await setupMessageBroker();
    logger.info('Message broker connection established');
    
    // Start server
    app.listen(port, () => {
      logger.info(`Auth service running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

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

export { app, bot };
