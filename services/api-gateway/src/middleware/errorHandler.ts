import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom error class with status code and additional details
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Used to distinguish operational errors from programming errors
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || {};
  
  // Handle specific types of errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid Token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token Expired';
  } else if (err.response) {
    // Error from axios (service call)
    statusCode = err.response.status || 500;
    message = err.response.data?.message || 'Service Error';
    details = err.response.data || {};
  }
  
  // Log the error (but not in tests)
  if (process.env.NODE_ENV !== 'test') {
    if (statusCode >= 500) {
      logger.error(`${statusCode} - ${message}`, {
        error: err.stack,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.warn(`${statusCode} - ${message}`, {
        path: req.path,
        method: req.method,
      });
    }
  }
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    details,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
