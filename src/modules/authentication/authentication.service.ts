import { Injectable } from '@nestjs/common';

import {
  LoginDto,
  SignupDto,
  ResendConfirmEmailDto,
  ConfirmEmailDto,
  resetforgotPassword,
} from './dto/authentication.dto';
import { UserRepository } from 'src/common/repository/index';
import { CachingService } from 'src/common/services/caching.services';
import { EmailService, TokenService } from 'src/common/services/index';
import { createNumberOtp } from 'src/common/utils/index';
import { HydratedDocument } from 'mongoose';
import { IUser } from 'src/common/interfaces/index';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common/exceptions';
import { EmailEnum, ProviderEnum, RoleEnum } from 'src/common/enums/index';
import { ConfigService } from '@nestjs/config';
import {
  generateHash,
  compareHash,
  encrypt,
  decrypt,
} from '../../common/modules/security/index';
import { emailEvent } from 'src/common/event/index';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { LoginResponse } from './entites/authentication.entity';
@Injectable()
export class AuthenticationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private emailService: EmailService,
    private readonly cacheservice: CachingService,
    private readonly userRepository: UserRepository,
  ) {}
  private SendEmailOtp = async ({
    email,
    subject,
    title,
  }: {
    email;
    subject;
    title;
  }): Promise<void> => {
    const otpKeyValue = this.cacheservice.otpKey({ email, subject });
    const trialKeyValue = this.cacheservice.maxAttemptOtpKey({
      email,
      subject,
    });
    const blockKeyValue = this.cacheservice.blockOtpKey({ email, subject });

    const isBlocked: number | null = await this.cacheservice.ttl(blockKeyValue);
    if (isBlocked !== null && isBlocked > 0) {
      throw new BadRequestException(
        `You are blocked. Try again after ${isBlocked}s`,
      );
    }
    const remainingOtpTTL: number | null =
      await this.cacheservice.ttl(otpKeyValue);
    if (remainingOtpTTL !== null && remainingOtpTTL > 0) {
      throw new BadRequestException(
        `Sorry, current OTP still active. Try again after ${remainingOtpTTL}s`,
      );
    }

    const maxTrial: number =
      Number(await this.cacheservice.get(trialKeyValue)) || 0;
    if (maxTrial >= 3) {
      await this.cacheservice.set({
        key: blockKeyValue,
        value: 1,
        ttl: 7 * 60,
      });
      throw new BadRequestException(`You are blocked for 7 minutes`);
    }

    const code: number = await createNumberOtp();

    await this.cacheservice.set({
      key: otpKeyValue,
      value: await generateHash({ plaintext: `${code}` }),
      ttl: 120,
    });

    emailEvent.emit('sendEmail', async () => {
      await this.emailService.sendEmail({
        to: email,
        subject,
        html: this.emailService.emailTemplete({ otp: code, title }),
      });

      await this.cacheservice.incr(trialKeyValue);
    });
  };

  login = async (data: LoginDto, issuer: string): Promise<LoginResponse> => {
    const { email, password, FCM } = data;
    const Existcheckuser: HydratedDocument<IUser> | null =
      await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          confirmEmail: { $exists: true },
        },
      });
    if (!Existcheckuser) {
      throw new NotFoundException(' Invalid login credentials');
    }
    console.log(Existcheckuser);
    const match = await compareHash({
      plaintext: password,
      cypherText: Existcheckuser.password as string,
    });
    if (!match) {
      throw new NotFoundException(' Invalid login credentials');
    }
    // if (FCM) {
    //   await this.cacheservice.addFCM(Existcheckuser._id.toString(), FCM);
    //   const tokens = await this.cacheservice.getFCMs(
    //     Existcheckuser._id.toString(),
    //   );
    //   if (tokens?.length) {
    //     await this.notification.sendNotifications({
    //       tokens: tokens,
    //       data: {
    //         title: 'New Login Detected',
    //         body: `new login ${new Date().toLocaleString()}`,
    //       },
    //     });
    //   }
    // }
    return await this.tokenService.createloginCredentials(
      Existcheckuser,
      issuer,
    );
  };

  signup = async ({
    email,
    password,
    username,
    phone,
    role,
  }: SignupDto): Promise<IUser> => {
    const checkUser = await this.userRepository.findOne({
      filter: { email },
      options: { lean: true },
    });

    if (checkUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userRepository.createOne({
      data: {
        email,
        password,
        username,
        phone: phone as string,
        role: role === 'admin' ? RoleEnum.ADMIN : RoleEnum.USER,
      },
    });

    if (!user) {
      throw new BadRequestException('Failed to create user');
    }

    const code = await createNumberOtp();
    await this.cacheservice.set({
      key: this.cacheservice.otpKey({ email }),
      value: await generateHash({ plaintext: `${code}` }),
      ttl: 120,
    });
    await this.emailService.sendEmail({
      to: email,
      subject: 'Confirm-Email',
      html: this.emailService.emailTemplete({
        otp: code,
        title: 'Confirm-Email',
      }),
    });
    await this.cacheservice.set({
      key: this.cacheservice.maxAttemptOtpKey({ email }),
      value: 1,
      ttl: 360,
    });

    return user.toJSON();
  };
  confirmEmail = async ({ email, otp }: ConfirmEmailDto) => {
    const account: HydratedDocument<IUser> | null =
      await this.userRepository.findOne({
        filter: {
          email,
          confirmEmail: { $exists: false },
          provider: ProviderEnum.SYSTEM,
        },
      });

    if (!account) throw new NotFoundException('fail to find matching account');
    const hashOtp = await this.cacheservice.get(
      this.cacheservice.otpKey({ email }),
    );
    if (!hashOtp) {
      throw new NotFoundException('Expired otp');
    }
    if (
      !(await compareHash({ plaintext: otp, cypherText: hashOtp as string }))
    ) {
      throw new ConflictException('Invalid otp');
    }
    account.confirmEmail = new Date();
    await account.save();
    await this.cacheservice.deleteKey([this.cacheservice.otpKey({ email })]);
    return;
  };
  resendConfirmEmail = async ({ email }: ResendConfirmEmailDto) => {
    const account: HydratedDocument<IUser> | null =
      await this.userRepository.findOne({
        filter: {
          email,
          confirmEmail: { $exists: false },
          provider: ProviderEnum.SYSTEM,
        },
      });

    if (!account) throw new NotFoundException('fail to find matching account');
    await this.SendEmailOtp({
      email,
      subject: EmailEnum.ConfirmEmail as string,
      title: 'Verify Email',
    });
    return;
  };
  requestForgotPasswordOtp = async ({ email }: ResendConfirmEmailDto) => {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!account) throw new NotFoundException('fail to find matching account');
    await this.SendEmailOtp({
      email,
      subject: EmailEnum.ForgotPassword as string,
      title: 'Reset Code',
    });
    return;
  };
  resetforgotPassword = async ({
    email,
    otp,
    password,
  }: resetforgotPassword) => {
    await this.verifyForgotPassword({ email, otp });

    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundException('account not exist');
    }

    user.password = await generateHash({ plaintext: password });
    user.changeCredentialsTime = new Date();

    await user.save();

    await this.cacheservice.deleteKey([
      this.cacheservice.otpKey({ email, subject: EmailEnum.ForgotPassword }),
    ]);
  };
  verifyForgotPassword = async ({ email, otp }: ConfirmEmailDto) => {
    const hashOtp = await this.cacheservice.get(
      this.cacheservice.otpKey({ email, subject: EmailEnum.ForgotPassword }),
    );
    if (!hashOtp) {
      throw new NotFoundException('Expired otp');
    }
    if (
      !(await compareHash({ plaintext: otp, cypherText: hashOtp as string }))
    ) {
      throw new ConflictException('Invalid otp');
    }
    await this.cacheservice.deleteKey([
      this.cacheservice.otpKey({ email, subject: EmailEnum.ForgotPassword }),
    ]);
    return;
  };
  private async verifyGoogleAccount(idToken: string) {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: this.configService.get('CLIENT_IDS'), // Specify the WEB_CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException('unverified email');
    }
    return payload;
  }
  async loginwithgmail(
    idToken: string,
    issuer: string,
  ): Promise<LoginResponse> {
    const payload = await this.verifyGoogleAccount(idToken);
    console.log(payload);
    if (!payload?.email) {
      throw new BadRequestException('Email not found in token');
    }
    const user = await this.userRepository.findOne({
      filter: { email: payload.email, provider: ProviderEnum.GOOGLE },
    });
    if (!user) {
      throw new NotFoundException('no registered account ');
    }
    return await this.tokenService.createloginCredentials(user, issuer);
  }
  async signupwithgmail(
    idToken: string,
    issuer: string,
  ): Promise<{ status: number; Credential: LoginResponse }> {
    const payload = await this.verifyGoogleAccount(idToken);
    console.log(payload);
    if (!payload?.email) {
      throw new BadRequestException('Email not found in token');
    }
    const checkuserExist = await this.userRepository.findOne({
      filter: { email: payload.email },
    });
    if (checkuserExist) {
      if (checkuserExist.provider != ProviderEnum.GOOGLE) {
        throw new ConflictException('email exist with different provider');
      }
      return {
        status: 200,
        Credential: await this.loginwithgmail(idToken, issuer),
      };
    }

    const user = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        provider: ProviderEnum.GOOGLE,
        confirmEmail: new Date(),
      },
    });
    return {
      status: 201,
      Credential: await this.loginwithgmail(idToken, issuer),
    };
  }
}
