import { Request, Response } from 'express';
import { logger } from '../utils/logger.utils';

/**
 * Global error handling middleware
 * Catches all errors thrown in the application and returns appropriate responses
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
): void => {
  logger.error(`Error: ${error.message}`, { stack: error.stack });

  // Handle CORS errors
  if (error.message === 'Not allowed by CORS') {
    res.status(403).json({
      status: 'error',
      message: 'Origin not allowed by CORS policy',
    });
    return;
  }

  // Handle 404 errors
  if (error.message === 'Path not found.') {
    res.status(404).json({
      status: 'error',
      message: 'Resource not found',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
