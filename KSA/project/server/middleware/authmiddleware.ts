import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization; // Get token from frontend

  if (!authHeader) return res.status(401).json({ message: 'No token found' });

  const token = authHeader.split(' ')[1]; // Format: Bearer <token>

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dummysecret');
    (req as any).user = decoded; // Save user info for next middleware
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
