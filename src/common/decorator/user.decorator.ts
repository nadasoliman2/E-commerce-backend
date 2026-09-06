import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../model';
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    let user: UserDocument | undefined;
    switch (ctx.getType()) {
      case 'http': {
        const req = ctx.switchToHttp().getRequest();
        user = req.user;
        break;
      }
      default:
        break;
    }
    return user;
  },
);
