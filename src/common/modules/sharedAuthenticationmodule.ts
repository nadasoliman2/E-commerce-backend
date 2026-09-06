import { Module, Global } from '@nestjs/common';
import { UserModel } from 'src/common/model/index';
import { UserRepository } from 'src/common/repository/index';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { CachingService } from 'src/common/services/caching.services';
import { EmailService, TokenService } from 'src/common/services/index';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
  imports: [UserModel],
  exports: [
    'Client_Redis',
    CachingService,
    UserRepository,

    JwtService,
    TokenService,
  ],
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
    UserRepository,
    CachingService,

    JwtService,
    TokenService,
  ],
})
export class SharedAuthenticationModule {}
