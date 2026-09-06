import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../enums';
export const roleName = 'Roles';
export const Role = (roles: RoleEnum[]) => {
  return SetMetadata(roleName, roles);
};
