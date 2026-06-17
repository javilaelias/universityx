import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?:   string;
  userRole?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token requerido' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as {
      sub: string; role: string;
    };
    req.userId   = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}
