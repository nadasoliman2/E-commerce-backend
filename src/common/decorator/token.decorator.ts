import { SetMetadata } from '@nestjs/common';
import { TokenTypeEnum } from '../enums';
export const Token = (tokenType: TokenTypeEnum = TokenTypeEnum.Access) => {
  return SetMetadata('tokenType', tokenType);
};
