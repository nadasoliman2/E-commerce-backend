import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { UserModel } from 'src/common/model/index';
import { UserRepository } from 'src/common/repository/index';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import{ CachingService } from 'src/common/services/caching.services';


@Module({
  imports: [UserModel],
  exports: [AuthenticationService, 'Client_Redis', CachingService],
  controllers: [AuthenticationController],
  providers: [
    {
      provide: 'Client_Redis',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get<string>('REDIS_URI'),
        });
        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();
        console.log('Connected to Redis');
        return client;
      },
      inject: [ConfigService],
    },
    AuthenticationService,
    UserRepository,
    CachingService,
  ],
})
export class AuthenticationModule {}
