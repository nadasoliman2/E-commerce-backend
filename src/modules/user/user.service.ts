import { Injectable } from '@nestjs/common';
@Injectable()
export class UserService {
  constructor() {}
  profile() {
    return { id: 1, username: 'nada', email: 'nadaemad271@gmail.com' };
  }
}
