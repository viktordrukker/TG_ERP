import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { publishMessage } from '../events/messageBroker';
import { Telegraf } from 'telegraf';

// Get Telegram bot instance from index file
import { bot } from '../index';

// Store 2FA verification codes temporarily in memory (in production, use Redis)
const verificationCodes: Record<string, { code: string; expires: Date }> = {};

/**
 * Generate random 6-digit code
 */
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate JWT token
 */
const generateToken = (userId: string): { token: string; refreshToken: string } => {
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
  const jwtExpires = process.env.JWT_EXPIRES_IN || '1d';
  const jwtRefreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpires });
  const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, jwtSecret, { expiresIn: jwtRefreshExpires });
  
  return { token, refreshToken };
};

/**
 * Register a new user with Telegram ID
 * 
 * @route POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { telegramId, name, username } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { telegramId } });
    
    if (existingUser) {
      throw new AppError('User with this Telegram ID already exists', 409);
    }
    
    // Create new user
    const user = await User.create({
      id: uuidv4(),
      telegramId,
      name,
      username,
      isActive: true,
    });
    
    // Publish user created event
    await publishMessage('user.created', {
      id: user.id,
      telegramId: user.telegramId,
      name: user.name,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('User registered successfully', { telegramId, userId: user.id });
    
    // Send welcome message via Telegram bot if available
    if (bot && telegramId) {
      try {
        await bot.telegram.sendMessage(
          telegramId,
          `Welcome to TG_ERP, ${name}! Your account has been created successfully.`
        );
      } catch (error) {
        logger.warn('Failed to send welcome message via Telegram', { error, telegramId });
      }
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          name: user.name,
          username: user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login with Telegram ID and initiate 2FA
 * 
 * @route POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { telegramId } = req.body;
    
    // Find user by Telegram ID
    const user = await User.findOne({ where: { telegramId, isActive: true } });
    
    if (!user) {
      throw new AppError('User not found or inactive', 404);
    }
    
    // Generate 2FA verification code
    const code = generateVerificationCode();
    const expiresIn = 10 * 60 * 1000; // 10 minutes in milliseconds
    const expires = new Date(Date.now() + expiresIn);
    
    // Store verification code (in production, use Redis with expiration)
    verificationCodes[telegramId] = { code, expires };
    
    // Send verification code via Telegram bot
    if (bot) {
      try {
        await bot.telegram.sendMessage(
          telegramId,
          `Your login verification code is: ${code}\nThis code will expire in 10 minutes.`
        );
        
        logger.info('2FA code sent successfully', { telegramId, userId: user.id });
        
        // Publish login attempt event
        await publishMessage('auth.login_attempt', {
          userId: user.id,
          telegramId,
          timestamp: new Date().toISOString(),
        });
        
        res.status(200).json({
          status: 'success',
          message: 'Verification code sent to your Telegram account',
          data: {
            telegramId,
            expiresAt: expires.toISOString(),
          },
        });
      } catch (error) {
        logger.error('Failed to send verification code via Telegram', { error, telegramId });
        throw new AppError('Failed to send verification code', 500);
      }
    } else {
      logger.error('Telegram bot not available for sending verification code', { telegramId });
      throw new AppError('Telegram bot service unavailable', 503);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Verify 2FA code and issue JWT token
 * 
 * @route POST /api/auth/verify-2fa
 */
export const verify2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { telegramId, code } = req.body;
    
    // Check if verification code exists and is valid
    const verification = verificationCodes[telegramId];
    
    if (!verification) {
      throw new AppError('No verification code found. Please request a new one', 400);
    }
    
    if (new Date() > verification.expires) {
      // Remove expired code
      delete verificationCodes[telegramId];
      throw new AppError('Verification code expired. Please request a new one', 400);
    }
    
    if (verification.code !== code) {
      throw new AppError('Invalid verification code', 400);
    }
    
    // Find user by Telegram ID
    const user = await User.findOne({ where: { telegramId, isActive: true } });
    
    if (!user) {
      throw new AppError('User not found or inactive', 404);
    }
    
    // Generate JWT token
    const { token, refreshToken } = generateToken(user.id);
    
    // Update last login timestamp
    await user.update({ lastLogin: new Date() });
    
    // Remove verification code after successful verification
    delete verificationCodes[telegramId];
    
    // Publish login success event
    await publishMessage('auth.login_success', {
      userId: user.id,
      telegramId,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('User logged in successfully', { telegramId, userId: user.id });
    
    res.status(200).json({
      status: 'success',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          name: user.name,
          username: user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh JWT token
 * 
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: string; type?: string };
      
      // Ensure this is a refresh token
      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid refresh token', 400);
      }
      
      // Find user by ID
      const user = await User.findOne({
        where: { id: decoded.id, isActive: true },
      });
      
      if (!user) {
        throw new AppError('User not found or inactive', 401);
      }
      
      // Generate new tokens
      const { token: newToken, refreshToken: newRefreshToken } = generateToken(user.id);
      
      logger.info('Token refreshed successfully', { userId: user.id });
      
      res.status(200).json({
        status: 'success',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid refresh token', 401);
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * 
 * @route POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a stateless JWT authentication system, the client simply discards the token
    // Here we can implement additional server-side logout logic if needed
    
    const user = req.user;
    
    // Publish logout event
    await publishMessage('auth.logout', {
      userId: user.id,
      telegramId: user.telegramId,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('User logged out successfully', { userId: user.id });
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
