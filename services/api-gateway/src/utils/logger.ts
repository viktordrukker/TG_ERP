import winston from 'winston';

/**
 * Setup and configure the application logger
 */
export const setupLogger = () => {
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  // Create logger instance
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'api-gateway' },
    transports: [
      // Write all logs to console
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            return `${timestamp} ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          })
        ),
      }),
    ],
  });

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    );
    logger.add(
      new winston.transports.File({ filename: 'logs/combined.log' })
    );
  }

  return logger;
};

// Export a default logger instance
export default setupLogger();
