import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        fields: (result.error as ZodError).errors.map((e) => ({
          field:   e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    if (source === 'body') req.body  = result.data;
    next();
  };
}
