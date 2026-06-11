// import { z } from 'zod';
// import { signup, login } from '../authentication.validation.js';
// export type SignupDto = z.infer<typeof signup>;
// export type LoginDto = z.infer<typeof login>;
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsStrongPassword,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

import { IsMatch } from '../../../common/decorator/index';
export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;
  @IsStrongPassword({
    minNumbers: 3,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  password!: string;
  @IsOptional()
  @IsString()
  FCM?: string;
}
export class SignupDto extends LoginDto {
  @MaxLength(55)
  @MinLength(2)
  @IsNotEmpty()
  username!: string;
  @ValidateIf((data: any) => {
    console.log({ data });
    return Boolean(data.password);
  })
  @IsMatch(['password'])
  confirmPassword!: string;
  @IsString()
  @IsOptional()
  phone?: string;
}
