import { Request, Response, NextFunction } from 'express';

export function actingUserMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Temporary static acting user for all requests
  req.userId = 1;
  next();
}

export default actingUserMiddleware;
