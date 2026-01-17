import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.utils';
export const genericAtuhCheck = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not set');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let decoded: any;
  const { storeKey } = req.query;
  try {
    decoded = jwt.verify(token!, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('Error in authorize-context:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (storeKey) {
    if ((decoded as any).storeKey !== storeKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  next();
};
