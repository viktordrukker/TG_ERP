import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AppError } from './errorHandler';
import logger from '../utils/logger';

// Interface for decoded JWT payload
interface JwtPayload {
  id: string;
  type?: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate requests using JWT
 * Verifies the token and injects user information to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Invalid authentication token format', 401);
    }
    
    // Verify token
    try {
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable not set');
        throw new AppError('Authentication service configuration error', 500);
      }
      
      // Verify and decode token
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      // Check if this is a regular token (not a refresh token)
      if (decoded.type === 'refresh') {
        throw new AppError('Invalid token type', 401);
      }
      
      // Verify token with Auth service
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
        const response = await axios.get(`${authServiceUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        
        if (response.status !== 200) {
          throw new AppError('Failed to verify token with Auth service', 401);
        }
        
        // Add user information to request
        req.user = response.data.data.user;
        req.token = token;
        
        // Continue to next middleware
        next();
      } catch (error: any) {
        if (error.response) {
          // Auth service returned an error
          throw new AppError(
            error.response.data.message || 'Authentication error',
            error.response.status || 401
          );
        } else if (error.request) {
          // Auth service not responding
          logger.error('Auth service not responding', { error: error.message });
          throw new AppError('Authentication service unavailable', 503);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token', 401);
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

// Extend Express Request interface to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}
