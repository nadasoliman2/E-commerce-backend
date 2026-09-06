import {
  GenderEnum,
  RoleEnum,
  ProviderEnum,
  LanguageEnum,
} from '../enums/user.enum.js';
export interface IUser {
  lang: LanguageEnum;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phone?: string;
  password?: string;
  profilepicture?: string;
  profilecoverpicture?: string[];
  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
