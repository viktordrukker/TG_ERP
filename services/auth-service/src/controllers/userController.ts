import { Request, Response, NextFunction } from 'express';
import { User, UserRole, Role } from '../models';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { publishMessage } from '../events/messageBroker';

/**
 * Get all users (paginated)
 * 
 * @route GET /api/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await User.count();
    
    // Get users with pagination
    const users = await User.findAll({
      attributes: ['id', 'telegramId', 'name', 'username', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * 
 * @route GET /api/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find user by ID
    const user = await User.findOne({
      where: { id },
      attributes: ['id', 'telegramId', 'name', 'username', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Get user roles
    const userRoles = await UserRole.findAll({
      where: { userId: id },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });
    
    const roles = userRoles.map((userRole: any) => userRole.role);
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
        roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * 
 * @route GET /api/users/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User is attached to request by the authenticate middleware
    const user = req.user;
    
    // Get user roles
    const userRoles = await UserRole.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });
    
    const roles = userRoles.map((userRole: any) => userRole.role);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          name: user.name,
          username: user.username,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * 
 * @route PUT /api/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, username, isActive } = req.body;
    
    // Find user by ID
    const user = await User.findOne({ where: { id } });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Update user
    await user.update({
      name: name !== undefined ? name : user.name,
      username: username !== undefined ? username : user.username,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });
    
    // Publish user updated event
    await publishMessage('user.updated', {
      id: user.id,
      telegramId: user.telegramId,
      name: user.name,
      isActive: user.isActive,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('User updated successfully', { userId: user.id });
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          name: user.name,
          username: user.username,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user (soft delete)
 * 
 * @route DELETE /api/users/:id
 */
export const deactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find user by ID
    const user = await User.findOne({ where: { id } });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Deactivate user (soft delete)
    await user.update({ isActive: false });
    
    // Publish user deactivated event
    await publishMessage('user.deactivated', {
      id: user.id,
      telegramId: user.telegramId,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('User deactivated successfully', { userId: user.id });
    
    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
