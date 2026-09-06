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
import { TokenTypeEnum, RoleEnum } from '../enums/index';
import { Reflector } from '@nestjs/core';
import { roleName } from '../decorator/role.decorator';
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenservice: TokenService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles =
      this.reflector.getAllAndOverride<RoleEnum[]>(roleName, [
        context.getHandler(),
        context.getClass(),
      ]) ?? TokenTypeEnum.Access;
    const req = context.switchToHttp().getRequest();

    let user!: UserDocument;
    switch (context.getType()) {
      case 'http':
        user = context.switchToHttp().getRequest().user;
    }

    return roles.includes(user.role);
  }
}
