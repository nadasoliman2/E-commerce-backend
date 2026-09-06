import { Types } from 'mongoose';
import { IUser } from './user.interface';
import{IBrand} from './brand.interface'
export interface ICategory {
  name: string;
  slug: string;
  image: string;
  brandIds: Types.ObjectId | IBrand;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
