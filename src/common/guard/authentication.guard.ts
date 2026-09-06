import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { TokenService } from '../services/token.service';
import { UserDocument } from '../model/index';
import { AuthenticationService } from '../../modules/authentication/authentication.service';
import { TokenTypeEnum } from '../enums/index';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenservice: TokenService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const tokenType =
      this.reflector.getAllAndOverride<TokenTypeEnum>('tokenType', [
        context.getHandler(),
        context.getClass(),
      ]) ?? TokenTypeEnum.Access;
    const req = context.switchToHttp().getRequest();

    const [schema, credentials] = req.headers.authorization?.split(' ') || [];

    if (!schema || !credentials) {
      throw new UnauthorizedException('Missing authentication credentials');
    }

    switch (schema) {
      case 'Basic': {
        const [email, password] = Buffer.from(credentials, 'base64')
          .toString()
          .split(':');

        await this.authenticationService.login(
          {
            email,
            password,
          },
          `${req.protocol}://${req.get('host')}`,
        );

        break;
      }

      case 'Bearer': {
        const { user, decoded } = await this.tokenservice.decodeToken({
          token: credentials,
          tokenType: tokenType,
        });

        req.user = user!;
        req.decoded = decoded;

        break;
      }
    }

    return true;
  }
}
