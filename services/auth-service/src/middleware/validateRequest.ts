import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Middleware to validate request data using express-validator
 * Checks for validation errors and sends appropriate response
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      param: error.param,
      msg: error.msg,
      value: error.value
    }));
    
    throw new AppError('Validation Error', 400, { errors: errorMessages });
  }
  
  next();
};
