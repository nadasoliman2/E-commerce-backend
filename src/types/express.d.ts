import { TokenTypeEnum } from '../common/enums';
import { UserDocument } from '../..common/model/index';
declare global {
  namespace Express {
    interface Request {
      tokenType?: TokenTypeEnum;
      user?: UserDocument;
      decoded: any;
    }
  }
}

export {};
