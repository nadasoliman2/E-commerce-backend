import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

import { EmailService } from 'src/common/services/index';
import { defaultlanguage } from 'src/common/middleware/index';
@Module({
  imports: [],
  exports: [AuthenticationService],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, EmailService],
})
export class AuthenticationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(defaultlanguage)
      .forRoutes({ path: 'auth/signup', method: RequestMethod.ALL });
  }
}
