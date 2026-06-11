import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  profile() {
    const user = this.userService.profile();

    return {
      message: 'Done',
      user,
    };
  }
}
