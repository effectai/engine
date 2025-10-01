import { Request, Response, NextFunction } from 'express';

// Middleware to validate numeric params
export function validateNumericParams(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of paramNames) {
      const value = Number(req.params[param]);

      if (isNaN(value) || !Number.isInteger(value)) {
	return res.status(400).json({ error: `Invalid ${param}: must be a number` });
      }

      req.params[param] = value as any;
    }
    next();
  };
}
