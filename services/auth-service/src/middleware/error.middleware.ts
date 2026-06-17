import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err:  unknown,
  req:  Request,
  res:  Response,
  _next: NextFunction
): void {
  console.error(`[auth-service] ${req.method} ${req.path} →`, err);

  if (res.headersSent) return;

  const status  = (err as { status?: number }).status ?? 500;
  const message = (err as { message?: string }).message ?? 'Error interno del servidor';

  res.status(status).json({
    error:  message,
    path:   req.path,
    method: req.method,
  });
}
