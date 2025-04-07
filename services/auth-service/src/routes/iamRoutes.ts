import express from 'express';
import { param, body } from 'express-validator';
import * as iamController from '../controllers/iamController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * Roles Routes
 */

/**
 * @route GET /api/iam/roles
 * @desc Get all roles
 * @access Private (Admin)
 */
router.get('/roles', iamController.getAllRoles);

/**
 * @route POST /api/iam/roles
 * @desc Create a new role
 * @access Private (Admin)
 */
router.post(
  '/roles',
  [
    body('name').notEmpty().withMessage('Role name is required'),
    body('description').optional(),
    validateRequest,
  ],
  iamController.createRole
);

/**
 * @route GET /api/iam/roles/:id
 * @desc Get role by ID
 * @access Private (Admin)
 */
router.get(
  '/roles/:id',
  [
    param('id').isUUID().withMessage('Invalid role ID format'),
    validateRequest,
  ],
  iamController.getRoleById
);

/**
 * @route PUT /api/iam/roles/:id
 * @desc Update role
 * @access Private (Admin)
 */
router.put(
  '/roles/:id',
  [
    param('id').isUUID().withMessage('Invalid role ID format'),
    body('name').optional().notEmpty().withMessage('Role name cannot be empty'),
    body('description').optional(),
    validateRequest,
  ],
  iamController.updateRole
);

/**
 * @route DELETE /api/iam/roles/:id
 * @desc Delete role
 * @access Private (Admin)
 */
router.delete(
  '/roles/:id',
  [
    param('id').isUUID().withMessage('Invalid role ID format'),
    validateRequest,
  ],
  iamController.deleteRole
);

/**
 * Permissions Routes
 */

/**
 * @route GET /api/iam/permissions
 * @desc Get all permissions
 * @access Private (Admin)
 */
router.get('/permissions', iamController.getAllPermissions);

/**
 * @route POST /api/iam/permissions
 * @desc Create a new permission
 * @access Private (Admin)
 */
router.post(
  '/permissions',
  [
    body('name').notEmpty().withMessage('Permission name is required'),
    body('resource').notEmpty().withMessage('Resource is required'),
    body('action').notEmpty().withMessage('Action is required'),
    body('description').optional(),
    validateRequest,
  ],
  iamController.createPermission
);

/**
 * @route GET /api/iam/permissions/:id
 * @desc Get permission by ID
 * @access Private (Admin)
 */
router.get(
  '/permissions/:id',
  [
    param('id').isUUID().withMessage('Invalid permission ID format'),
    validateRequest,
  ],
  iamController.getPermissionById
);

/**
 * @route DELETE /api/iam/permissions/:id
 * @desc Delete permission
 * @access Private (Admin)
 */
router.delete(
  '/permissions/:id',
  [
    param('id').isUUID().withMessage('Invalid permission ID format'),
    validateRequest,
  ],
  iamController.deletePermission
);

/**
 * Role-Permission Assignment Routes
 */

/**
 * @route POST /api/iam/roles/:roleId/permissions
 * @desc Assign permissions to a role
 * @access Private (Admin)
 */
router.post(
  '/roles/:roleId/permissions',
  [
    param('roleId').isUUID().withMessage('Invalid role ID format'),
    body('permissionIds').isArray().withMessage('Permission IDs must be an array'),
    body('permissionIds.*').isUUID().withMessage('Invalid permission ID format'),
    validateRequest,
  ],
  iamController.assignPermissionsToRole
);

/**
 * @route DELETE /api/iam/roles/:roleId/permissions/:permissionId
 * @desc Remove a permission from a role
 * @access Private (Admin)
 */
router.delete(
  '/roles/:roleId/permissions/:permissionId',
  [
    param('roleId').isUUID().withMessage('Invalid role ID format'),
    param('permissionId').isUUID().withMessage('Invalid permission ID format'),
    validateRequest,
  ],
  iamController.removePermissionFromRole
);

/**
 * User-Role Assignment Routes
 */

/**
 * @route POST /api/iam/users/:userId/roles
 * @desc Assign roles to a user
 * @access Private (Admin)
 */
router.post(
  '/users/:userId/roles',
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    body('roleIds').isArray().withMessage('Role IDs must be an array'),
    body('roleIds.*').isUUID().withMessage('Invalid role ID format'),
    validateRequest,
  ],
  iamController.assignRolesToUser
);

/**
 * @route DELETE /api/iam/users/:userId/roles/:roleId
 * @desc Remove a role from a user
 * @access Private (Admin)
 */
router.delete(
  '/users/:userId/roles/:roleId',
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    param('roleId').isUUID().withMessage('Invalid role ID format'),
    validateRequest,
  ],
  iamController.removeRoleFromUser
);

export default router;
