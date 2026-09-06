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
  Matches,
} from 'class-validator';

import { IsMatch } from '../../../common/decorator/index';
export class ResendConfirmEmailDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;
}
export class ConfirmEmailDto extends ResendConfirmEmailDto {
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp!: string;
}
export class resetforgotPassword extends ConfirmEmailDto {
  @IsStrongPassword({
    minNumbers: 3,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  password!: string;
}

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
  @IsString()
  @IsOptional()
  role?: string;
}
export class SignupWithGmailDto {
  @IsString()
  idToken!: string;
}
