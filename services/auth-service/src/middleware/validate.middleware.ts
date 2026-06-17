import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error:  'Datos inválidos',
        fields: formatZodError(result.error),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

function formatZodError(err: ZodError) {
  return err.errors.map((e) => ({
    field:   e.path.join('.'),
    message: e.message,
  }));
}
