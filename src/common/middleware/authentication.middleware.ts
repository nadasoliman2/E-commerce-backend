import { NestMiddleware, Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services';

export const preAuthMiddleware = (tokenType) => {
  return (req, res, next) => {
    if (!req.headers['authorization']) {
      res.status(401).json({ message: 'missing authorization' });
    }

    req.tokenType = tokenType;
    next();
  };
};

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return next();
    }

    const [key, token] = authorization.split(' ');

    console.log({ key, token });

    const { user, decoded } = await this.tokenService.decodeToken({
      token,
      tokenType: req.tokenType,
    });

    console.log({ user, decoded });

    next();
  }
}
