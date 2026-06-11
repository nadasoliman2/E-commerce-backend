import {
  ValidationPipe,
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignupDto, LoginDto } from './dto/authentication.dto';

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
  ) {
    const user = await this.authenticationService.signup(body);
    return {
      message: 'Done',
      user,
    };
  }

  @Post('login')
  login(@Body(new ValidationPipe()) body: LoginDto) {
    const user = this.authenticationService.login(body);
    return { user };
  }
}
