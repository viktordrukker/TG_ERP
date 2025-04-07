import { Request, Response, NextFunction } from 'express';
import { User, Role, Permission, UserRole, RolePermission } from '../models';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { publishMessage } from '../events/messageBroker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Roles Management
 */

/**
 * Get all roles
 * 
 * @route GET /api/iam/roles
 */
export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all roles
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by ID
 * 
 * @route GET /api/iam/roles/:id
 */
export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find role by ID
    const role = await Role.findOne({
      where: { id },
      attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
    });
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Get permissions for this role
    const rolePermissions = await RolePermission.findAll({
      where: { roleId: id },
      include: [
        {
          model: Permission,
          as: 'permission',
          attributes: ['id', 'name', 'resource', 'action', 'description'],
        },
      ],
    });
    
    const permissions = rolePermissions.map((rp: any) => rp.permission);
    
    res.status(200).json({
      status: 'success',
      data: {
        role,
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new role
 * 
 * @route POST /api/iam/roles
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    
    if (existingRole) {
      throw new AppError('Role with this name already exists', 409);
    }
    
    // Create new role
    const role = await Role.create({
      id: uuidv4(),
      name,
      description,
    });
    
    // Publish role created event
    await publishMessage('iam.role.created', {
      id: role.id,
      name: role.name,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Role created successfully', { roleName: role.name });
    
    res.status(201).json({
      status: 'success',
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update role
 * 
 * @route PUT /api/iam/roles/:id
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Find role by ID
    const role = await Role.findOne({ where: { id } });
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Check if new name already exists (if name is being updated)
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      
      if (existingRole) {
        throw new AppError('Role with this name already exists', 409);
      }
    }
    
    // Update role
    await role.update({
      name: name || role.name,
      description: description !== undefined ? description : role.description,
    });
    
    // Publish role updated event
    await publishMessage('iam.role.updated', {
      id: role.id,
      name: role.name,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Role updated successfully', { roleId: role.id });
    
    res.status(200).json({
      status: 'success',
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete role
 * 
 * @route DELETE /api/iam/roles/:id
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find role by ID
    const role = await Role.findOne({ where: { id } });
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Check if role is in use
    const userRoleCount = await UserRole.count({ where: { roleId: id } });
    
    if (userRoleCount > 0) {
      throw new AppError('Cannot delete role that is still assigned to users', 400);
    }
    
    // Delete role permissions
    await RolePermission.destroy({ where: { roleId: id } });
    
    // Delete role
    await role.destroy();
    
    // Publish role deleted event
    await publishMessage('iam.role.deleted', {
      id: role.id,
      name: role.name,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Role deleted successfully', { roleId: role.id });
    
    res.status(200).json({
      status: 'success',
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permissions Management
 */

/**
 * Get all permissions
 * 
 * @route GET /api/iam/permissions
 */
export const getAllPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all permissions
    const permissions = await Permission.findAll({
      attributes: ['id', 'name', 'resource', 'action', 'description', 'createdAt', 'updatedAt'],
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get permission by ID
 * 
 * @route GET /api/iam/permissions/:id
 */
export const getPermissionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find permission by ID
    const permission = await Permission.findOne({
      where: { id },
      attributes: ['id', 'name', 'resource', 'action', 'description', 'createdAt', 'updatedAt'],
    });
    
    if (!permission) {
      throw new AppError('Permission not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        permission,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new permission
 * 
 * @route POST /api/iam/permissions
 */
export const createPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, resource, action, description } = req.body;
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      where: { name },
    });
    
    if (existingPermission) {
      throw new AppError('Permission with this name already exists', 409);
    }
    
    // Create new permission
    const permission = await Permission.create({
      id: uuidv4(),
      name,
      resource,
      action,
      description,
    });
    
    // Publish permission created event
    await publishMessage('iam.permission.created', {
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Permission created successfully', { permissionName: permission.name });
    
    res.status(201).json({
      status: 'success',
      data: {
        permission: {
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete permission
 * 
 * @route DELETE /api/iam/permissions/:id
 */
export const deletePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find permission by ID
    const permission = await Permission.findOne({ where: { id } });
    
    if (!permission) {
      throw new AppError('Permission not found', 404);
    }
    
    // Check if permission is in use
    const rolePermissionCount = await RolePermission.count({ where: { permissionId: id } });
    
    if (rolePermissionCount > 0) {
      throw new AppError('Cannot delete permission that is still assigned to roles', 400);
    }
    
    // Delete permission
    await permission.destroy();
    
    // Publish permission deleted event
    await publishMessage('iam.permission.deleted', {
      id: permission.id,
      name: permission.name,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Permission deleted successfully', { permissionId: permission.id });
    
    res.status(200).json({
      status: 'success',
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Permission Assignment
 */

/**
 * Assign permissions to a role
 * 
 * @route POST /api/iam/roles/:roleId/permissions
 */
export const assignPermissionsToRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;
    
    // Find role by ID
    const role = await Role.findOne({ where: { id: roleId } });
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Verify all permissions exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });
    
    if (permissions.length !== permissionIds.length) {
      throw new AppError('One or more permissions not found', 404);
    }
    
    // Create role-permission associations
    const rolePermissions = [];
    
    for (const permissionId of permissionIds) {
      // Check if association already exists
      const existingRolePermission = await RolePermission.findOne({
        where: { roleId, permissionId },
      });
      
      if (!existingRolePermission) {
        // Create new association
        const rolePermission = await RolePermission.create({
          id: uuidv4(),
          roleId,
          permissionId,
        });
        
        rolePermissions.push(rolePermission);
      }
    }
    
    // Publish role permissions updated event
    await publishMessage('iam.role.permissions.updated', {
      roleId,
      permissionIds,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Permissions assigned to role', { roleId, permissionCount: rolePermissions.length });
    
    res.status(200).json({
      status: 'success',
      message: `${rolePermissions.length} permissions assigned to role`,
      data: {
        roleId,
        permissionsAssigned: rolePermissions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a permission from a role
 * 
 * @route DELETE /api/iam/roles/:roleId/permissions/:permissionId
 */
export const removePermissionFromRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roleId, permissionId } = req.params;
    
    // Find role-permission association
    const rolePermission = await RolePermission.findOne({
      where: { roleId, permissionId },
    });
    
    if (!rolePermission) {
      throw new AppError('Role does not have this permission', 404);
    }
    
    // Delete association
    await rolePermission.destroy();
    
    // Publish role permission removed event
    await publishMessage('iam.role.permission.removed', {
      roleId,
      permissionId,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Permission removed from role', { roleId, permissionId });
    
    res.status(200).json({
      status: 'success',
      message: 'Permission removed from role',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User-Role Assignment
 */

/**
 * Assign roles to a user
 * 
 * @route POST /api/iam/users/:userId/roles
 */
export const assignRolesToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { roleIds } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify all roles exist
    const roles = await Role.findAll({
      where: { id: roleIds },
    });
    
    if (roles.length !== roleIds.length) {
      throw new AppError('One or more roles not found', 404);
    }
    
    // Create user-role associations
    const userRoles = [];
    
    for (const roleId of roleIds) {
      // Check if association already exists
      const existingUserRole = await UserRole.findOne({
        where: { userId, roleId },
      });
      
      if (!existingUserRole) {
        // Create new association
        const userRole = await UserRole.create({
          id: uuidv4(),
          userId,
          roleId,
        });
        
        userRoles.push(userRole);
      }
    }
    
    // Publish user roles updated event
    await publishMessage('iam.user.roles.updated', {
      userId,
      roleIds,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Roles assigned to user', { userId, roleCount: userRoles.length });
    
    res.status(200).json({
      status: 'success',
      message: `${userRoles.length} roles assigned to user`,
      data: {
        userId,
        rolesAssigned: userRoles.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a role from a user
 * 
 * @route DELETE /api/iam/users/:userId/roles/:roleId
 */
export const removeRoleFromUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, roleId } = req.params;
    
    // Find user-role association
    const userRole = await UserRole.findOne({
      where: { userId, roleId },
    });
    
    if (!userRole) {
      throw new AppError('User does not have this role', 404);
    }
    
    // Delete association
    await userRole.destroy();
    
    // Publish user role removed event
    await publishMessage('iam.user.role.removed', {
      userId,
      roleId,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Role removed from user', { userId, roleId });
    
    res.status(200).json({
      status: 'success',
      message: 'Role removed from user',
    });
  } catch (error) {
    next(error);
  }
};
