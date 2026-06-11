import { Injectable, ConflictException } from '@nestjs/common';

import { SignupDto } from './dto/authentication.dto';
import { UserRepository } from 'src/common/repository/index';
import {CachingService} from "src/common/services/caching.services";
@Injectable()
export class AuthenticationService {
  constructor(private readonly cacheservice: CachingService,
    private readonly userrepository: UserRepository) {}

  async signup(data: SignupDto) {
    const checkuserExist = await this.userrepository.findOne({
      filter: { email: data.email },
    });
    if (checkuserExist) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userrepository.createOne({
      data: data,
    });
    this.cacheservice.set({

      key:"nada",
    value:"12"})


    return user;
  }
  login(data: unknown) {
    return { data };
  }
}
