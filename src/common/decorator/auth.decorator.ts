import { Token } from './token.decorator';
import { Role } from './role.decorator';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { TokenTypeEnum, RoleEnum } from '../enums/index';
import { AuthenticationGuard, AuthorizationGuard } from '../guard/index';

export const Auth = (
  roles: RoleEnum[],
  type: TokenTypeEnum = TokenTypeEnum.Access,
) => {
  return applyDecorators(
    Token(type),
    Role(roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
  );
};
