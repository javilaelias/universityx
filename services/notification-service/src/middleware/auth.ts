import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token requerido' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as {
      sub: string; role: string; email: string;
    };
    req.userId    = payload.sub;
    req.userRole  = payload.role;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!['admin', 'support'].includes(req.userRole ?? '')) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    next();
  });
}
