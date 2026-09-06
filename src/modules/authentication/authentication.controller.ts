import {
  ValidationPipe,
  Body,
  Controller,
  Post,
  UsePipes,
  Patch,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import {
  SignupDto,
  LoginDto,
  ResendConfirmEmailDto,
  resetforgotPassword,
  ConfirmEmailDto,
  SignupWithGmailDto,
} from './dto/authentication.dto';
import type { Request, Response } from 'express';
import { WatchInterceptor } from 'src/common/interceptor/watch.interceptor';
import { IUser } from 'src/common/interfaces';
import { LoginResponse } from './entites/authentication.entity';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('signup')
  async signup(
    @Body(new ValidationPipe())
    body: SignupDto,
  ): Promise<IUser> {
    return await this.authenticationService.signup(body);
  }

  // @UseInterceptors(WatchInterceptor)
  @Post('login')
  async login(
    @Body(new ValidationPipe()) body: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    return await this.authenticationService.login(
      body,
      `${req.protocol}://${req.host}`,
    );
  }

  @Patch('/resend-confirm-email')
  async resendConfirmEmail(
    @Body(new ValidationPipe()) body: ResendConfirmEmailDto,
  ) {
    const account = await this.authenticationService.resendConfirmEmail(body);
    return;
  }
  @Post('/request-forgot-password')
  async requestForgotPassword(
    @Body(new ValidationPipe()) body: ResendConfirmEmailDto,
  ): Promise<void> {
    const account =
      await this.authenticationService.requestForgotPasswordOtp(body);
    return;
  }

  @Patch('/verify-forgot-password')
  async verifyForgotPassword(
    @Body(new ValidationPipe()) body: ConfirmEmailDto,
  ): Promise<void> {
    const account = await this.authenticationService.verifyForgotPassword(body);
    return;
  }
  @Patch('/reset-forgot-password')
  async resetForgotPassword(
    @Body(new ValidationPipe()) body: resetforgotPassword,
  ): Promise<void> {
    const account = await this.authenticationService.resetforgotPassword(body);
    return;
  }
  @Patch('/confirm-email')
  async confirmEmail(
    @Body(new ValidationPipe()) body: ConfirmEmailDto,
  ): Promise<void> {
    const account = await this.authenticationService.confirmEmail(body);
    return;
  }
  @Post('/signup/with/gmail')
  async signupwithgmail(
    @Body() body: SignupWithGmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: number; Credential: LoginResponse }> {
    const { status, Credential } =
      await this.authenticationService.signupwithgmail(
        body.idToken,
        `${req.protocol}://${req.host}`,
      );
    res.status(status);
    return { status, Credential };
  }
}
