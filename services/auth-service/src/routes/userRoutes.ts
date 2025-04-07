import express from 'express';
import { param, body } from 'express-validator';
import * as userController from '../controllers/userController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/users
 * @desc Get all users (paginated)
 * @access Private (Admin)
 */
router.get(
  '/',
  authorize(['admin', 'manager']),
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    validateRequest,
  ],
  authorize(['admin', 'manager'], true), // allowSelf=true allows users to access their own data
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('username').optional(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  authorize(['admin'], true), // allowSelf=true allows users to update their own data
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Deactivate user (soft delete)
 * @access Private (Admin only)
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    validateRequest,
  ],
  authorize(['admin']),
  userController.deactivateUser
);

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', userController.getCurrentUser);

export default router;
