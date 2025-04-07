import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { Role, Permission, UserRole, RolePermission } from '../models';
import logger from '../utils/logger';

/**
 * Middleware to authorize users based on roles
 * Checks if the authenticated user has the required roles or permissions
 * 
 * @param requiredRoles Array of role names that are allowed to access the route
 * @param allowSelf If true, allows users to access their own resources regardless of role
 */
export const authorize = (requiredRoles: string[] = [], allowSelf: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Make sure user is authenticated
      if (!req.user) {
        throw new AppError('Unauthorized: Authentication required', 401);
      }
      
      // If accessing own resource and allowSelf is true
      if (allowSelf && req.params.id && req.params.id === req.user.id) {
        return next();
      }
      
      // Get user roles
      const userRoles = await UserRole.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: Role,
            as: 'role',
          },
        ],
      });
      
      // Check if user has required roles
      const roles = userRoles.map((userRole: any) => userRole.role.name);
      
      // If no specific roles are required, allow access
      if (requiredRoles.length === 0) {
        return next();
      }
      
      // Check if user has any of the required roles
      const hasRequiredRole = roles.some((role: string) => 
        requiredRoles.includes(role)
      );
      
      if (hasRequiredRole) {
        return next();
      }
      
      // If user doesn't have required roles, check permissions
      const roleIds = userRoles.map((userRole: any) => userRole.roleId);
      
      // Get permissions for these roles
      const rolePermissions = await RolePermission.findAll({
        where: { roleId: roleIds },
        include: [
          {
            model: Permission,
            as: 'permission',
          },
        ],
      });
      
      // Extract the resource and action from the request
      const resource = req.baseUrl.split('/').pop() || '';
      const action = getActionFromMethod(req.method);
      
      // Check if user has permission for this resource and action
      const hasPermission = rolePermissions.some((rp: any) => 
        rp.permission.resource === resource && 
        rp.permission.action === action
      );
      
      if (hasPermission) {
        return next();
      }
      
      // If user doesn't have required roles or permissions
      throw new AppError('Forbidden: Insufficient permissions', 403);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to get the action type from HTTP method
 */
function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}
