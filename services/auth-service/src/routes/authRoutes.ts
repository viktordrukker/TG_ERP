import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user with Telegram ID
 * @access Public
 */
router.post(
  '/register',
  [
    body('telegramId').notEmpty().withMessage('Telegram ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('username').optional(),
    validateRequest,
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Authenticate a user and send 2FA code
 * @access Public
 */
router.post(
  '/login',
  [
    body('telegramId').notEmpty().withMessage('Telegram ID is required'),
    validateRequest,
  ],
  authController.login
);

/**
 * @route POST /api/auth/verify-2fa
 * @desc Verify 2FA code and issue JWT token
 * @access Public
 */
router.post(
  '/verify-2fa',
  [
    body('telegramId').notEmpty().withMessage('Telegram ID is required'),
    body('code').notEmpty().withMessage('Verification code is required'),
    validateRequest,
  ],
  authController.verify2FA
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh JWT token
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validateRequest,
  ],
  authController.refreshToken
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

export default router;
