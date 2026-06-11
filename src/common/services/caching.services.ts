import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { EmailEnum } from '../enums/email.enum.js';
import { Types } from 'mongoose';

interface SetOptions {
  key: string;
  value: unknown;
  ttl?: number;
}

@Injectable()
export class CachingService {
  constructor(
    @Inject('Client_Redis')
    private readonly redisClient: RedisClientType,
  ) {}

  revokeTokenKey = ({
    userId,
    jti,
  }: {
    userId: Types.ObjectId | string;
    jti: string;
  }): string => {
    return `RevokeToken::${userId}::${jti}`;
  };

  otpKey = ({
    email,
    subject = EmailEnum.ConfirmEmail,
  }: {
    email: string;
    subject?: EmailEnum | string;
  }): string => {
    return `OTP::User::${email}::${subject}`;
  };

  blockOtpKey = ({
    email,
    subject = EmailEnum.ConfirmEmail,
  }: {
    email: string;
    subject?: EmailEnum | string;
  }): string => {
    return `OTP::User::${email}::${subject}::Block`;
  };

  maxAttemptOtpKey = ({
    email,
    subject = EmailEnum.ConfirmEmail,
  }: {
    email: string;
    subject?: EmailEnum | string;
  }): string => {
    return `OTP::User::${email}::${subject}::MaxTrial`;
  };

  baseRevokeTokenKey = (userId: Types.ObjectId | string): string => {
    return `RevokeToken::${userId}`;
  };

  FCM_key = (userId: Types.ObjectId | string): string => {
    return `user:FCM:${userId}`;
  };

  async set({ key, value, ttl }: SetOptions): Promise<void> {
    try {
      const data = JSON.stringify(value);

      if (ttl !== undefined) {
        await this.redisClient.set(key, data, { EX: ttl });
      } else {
        await this.redisClient.set(key, data);
      }
    } catch (error) {
      console.log(`redis set error: ${error}`);
    }
  }

  async update({ key, value, ttl }: SetOptions): Promise<number> {
    try {
      const exists = await this.redisClient.exists(key);

      if (!exists) return 0;

      await this.set({ key, value, ttl });

      return 1;
    } catch (error) {
      console.log(`redis update error: ${error}`);
      return 0;
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);

      if (!data) return null;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    } catch (error) {
      console.log(`fail in redis get operation ${error}`);
      return null;
    }
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  async exist(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }
  expire = async ({
    key,
    ttl,
  }: {
    key: string;
    ttl: number;
  }): Promise<number> => {
    return await this.redisClient.expire(key, ttl);
  };
  async mGet(keys: string[]): Promise<(string | null)[]> {
    try {
      if (!keys.length) return [];

      return await this.redisClient.mGet(keys);
    } catch (error) {
      console.log(`fail in redis mGet operation ${error}`);
      return [];
    }
  }

  async keys(prefix: string): Promise<string[]> {
    try {
      return await this.redisClient.keys(`${prefix}*`);
    } catch (error) {
      console.log(`fail in redis keys operation ${error}`);
      return [];
    }
  }

  async deleteKey(keys: string[]): Promise<number> {
    if (!keys.length) return 0;

    return this.redisClient.del(keys);
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async addFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return this.redisClient.sAdd(this.FCM_key(userId), FCMToken);
  }

  async removeFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return this.redisClient.sRem(this.FCM_key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId | string): Promise<string[]> {
    return this.redisClient.sMembers(this.FCM_key(userId));
  }

  async hasFCMs(userId: Types.ObjectId | string): Promise<number> {
    return this.redisClient.sCard(this.FCM_key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId | string): Promise<number> {
    return this.redisClient.del(this.FCM_key(userId));
  }

  socketkey(userId: Types.ObjectId | string) {
    return `user:sockets:${userId}`;
  }

  async addSocket(userId: Types.ObjectId | string, socketId: string) {
    return this.redisClient.sAdd(this.socketkey(userId), socketId);
  }

  async removeSocket(userId: Types.ObjectId | string, socketId: string) {
    return this.redisClient.sRem(this.socketkey(userId), socketId);
  }

  async getSockets(userId: Types.ObjectId | string) {
    return this.redisClient.sMembers(this.socketkey(userId));
  }

  async hasSockets(userId: Types.ObjectId | string) {
    return this.redisClient.sCard(this.socketkey(userId));
  }

  async removeUser(userId: Types.ObjectId | string) {
    return this.redisClient.del(this.socketkey(userId));
  }
}
