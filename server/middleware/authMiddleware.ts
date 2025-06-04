import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User from '../models/userModel';


declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        role: string;
        email: string;
      };
    }
  }
}

interface JwtPayload {
  _id: string;
  role: string;
  email: string;
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check cookies first
  if (req.cookies?.token) {
    token = req.cookies.token;
    console.log('Found token in cookies:', token);
  } 


  if (!token) {
    console.log('No token found');
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    
    // Verify user still exists
    const user = await User.findById(decoded._id).select('role email');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Attach user to request with proper typing
    req.user = {
      _id: new Types.ObjectId(decoded._id),
      role: user.role,
      email: user.email
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Token verification error:', err);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden - Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports={verifyToken, authorizeRoles};