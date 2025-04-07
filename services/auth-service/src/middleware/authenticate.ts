import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { User } from '../models';
import logger from '../utils/logger';

// Add user property to Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Verifies the token and attaches user to request object
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Invalid authentication token format', 401);
    }
    
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: string };
      
      // Find user by ID
      const user = await User.findOne({
        where: { id: decoded.id, isActive: true },
      });
      
      if (!user) {
        throw new AppError('User not found or inactive', 401);
      }
      
      // Attach user and token to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
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
