import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index.js';
import { queryOne } from '../db/database.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  // The fallback below is public in the repository; never sign production tokens with it
  throw new Error('JWT_SECRET must be set in production.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'medralink_secure_academic_jwt_secret_2026';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  patientId?: string;
  patientUid?: string;
  doctorId?: string;
  doctorUid?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies the bearer token, then re-checks the account status so a suspension
 * by an administrator takes effect immediately rather than when the token expires.
 */
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Missing or invalid Authorization header.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const account = await queryOne<{ status: string }>('SELECT status FROM users WHERE id = ?', [decoded.id]);
    if (!account || account.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended or no longer exists.' });
    }
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired access token.'
    });
  }
}
