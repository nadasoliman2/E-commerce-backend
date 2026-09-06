import type { NextFunction, Request, Response } from 'express';

export const defaultlanguage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("I'm here");
  next();
};
