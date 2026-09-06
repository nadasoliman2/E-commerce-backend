import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { UserRepository } from '../repository/index';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { RoleEnum, TokenTypeEnum } from '../enums/index.js';
import { randomUUID } from 'node:crypto';
import { CachingService } from 'src/common/services/caching.services';

import { HydratedDocument } from 'mongoose';
import { IUser } from '../interfaces/user.interface.js';
import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UserDocument } from '../model/index.js';
import { FlattenMaps } from 'mongoose';
import { ConfigService } from '@nestjs/config';
/* ============================= */
/*            TYPES              */
/* ============================= */
interface IGenerateToken {
  payload?: string | Buffer | object;
  secret?: string;
  options?: SignOptions;
}

interface IVerifyToken {
  token: string;
  secret?: string;
  options?: VerifyOptions;
}

interface IGetTokenSignature {
  tokenType?: TokenTypeEnum;
  level: RoleEnum;
}

interface IDecodeTokenInput {
  token: string;
  tokenType?: TokenTypeEnum;
}

interface IDecodedToken extends JwtPayload {
  sub: string;
  aud: string[];
  jti: string;
  iat: number;
}

/* ============================= */
/*        JWT GENERATION         */
/* ============================= */
@Injectable()
export class TokenService {
  private user_access_token_secret: string;
  private refresh_user_token_secret: string;
  private access_token_expires_in: number;
  private refresh_token_expires_in: number;
  private system_access_token_secret: string;
  private refresh_system_token_secret: string;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheservice: CachingService,
    private readonly configService: ConfigService,
  ) {
    this.user_access_token_secret = this.configService.get<string>(
      'user_access_token_secret',
    )!;
    this.refresh_user_token_secret = this.configService.get<string>(
      'refresh_user_token_secret',
    )!;
    this.access_token_expires_in = Number(
      this.configService.get<number>('access_token_expires_in')!,
    );
    this.refresh_token_expires_in = Number(
      this.configService.get<number>('refresh_token_expires_in')!,
    );
    this.system_access_token_secret = this.configService.get<string>(
      'system_access_token_secret',
    )!;
    this.refresh_system_token_secret = this.configService.get<string>(
      'refresh_system_token_secret',
    )!;
  }
  generateToken = async ({
    payload = {},
    secret = this.user_access_token_secret,
    options = {},
  }: IGenerateToken): Promise<string> => {
    console.log('JWT OPTIONS =>', options);

    return jwt.sign(payload, secret, options);
  };
  verifyToken = async ({
    token,
    secret = this.user_access_token_secret,
    options = {},
  }: IVerifyToken): Promise<string | JwtPayload> => {
    return jwt.verify(token, secret, options);
  };

  /* ============================= */
  /*      SIGNATURE DETECTION      */
  /* ============================= */

  detectSigntureLevel = async (
    level: RoleEnum,
  ): Promise<{ accessSignature: string; refreshSignature: string }> => {
    switch (level) {
      case RoleEnum.ADMIN:
        return {
          accessSignature: this.system_access_token_secret,
          refreshSignature: this.refresh_system_token_secret,
        };

      default:
        return {
          accessSignature: this.user_access_token_secret,
          refreshSignature: this.refresh_user_token_secret,
        };
    }
  };

  getTokenSignture = async ({
    tokenType = TokenTypeEnum.Access,
    level,
  }: IGetTokenSignature): Promise<string> => {
    const { accessSignature, refreshSignature } =
      await this.detectSigntureLevel(level);

    switch (tokenType) {
      case TokenTypeEnum.Refresh:
        return refreshSignature;

      default:
        return accessSignature;
    }
  };

  /* ============================= */
  /*          DECODE TOKEN         */
  /* ============================= */

  decodeToken = async ({
    token,
    tokenType = TokenTypeEnum.Access,
  }: IDecodeTokenInput): Promise<{
    user: UserDocument | null;
    decoded: IDecodedToken;
  }> => {
    const decodedRaw = jwt.decode(token);

    if (!decodedRaw || typeof decodedRaw === 'string') {
      throw new BadRequestException('Invalid token');
    }

    const decoded = decodedRaw as IDecodedToken;
    const { sub, aud, jti, iat } = decoded;

    if (!aud?.length) {
      throw new BadRequestException('Missing token audience');
    }

    const [tokenApproachRaw, levelRaw] = aud;

    const tokenApproach = tokenApproachRaw as unknown as TokenTypeEnum;
    const level = levelRaw as unknown as RoleEnum;

    if (tokenType !== tokenApproach) {
      throw new BadRequestException('Unexpected token mechanism');
    }

    // Check revoked session
    if (
      jti &&
      (await this.cacheservice.get(
        this.cacheservice.revokeTokenKey({
          userId: sub,
          jti: jti,
        }),
      ))
    ) {
      throw new UnauthorizedException('Invalid login session');
    }

    const secret = await this.getTokenSignture({
      tokenType: tokenApproach,
      level,
    });

    jwt.verify(token, secret);

    const user: UserDocument | null = await this.userRepository.findbyid({
      _id: sub,
      projection: { password: 0 },
      options: {
        populate: {
          path: 'friends',
          match: { deletedAt: null },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if credentials changed after token issue
    if (
      user.changeCredentialsTime &&
      user.changeCredentialsTime.getTime() >= iat * 1000
    ) {
      throw new UnauthorizedException('Invalid login session');
    }

    return { user, decoded };
  };

  /* ============================= */
  /*      CREATE LOGIN TOKENS      */
  /* ============================= */

  createloginCredentials = async (
    user: UserDocument,
    issuer: string,
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const { accessSignature, refreshSignature } =
      await this.detectSigntureLevel(user.role);

    const jwtid = randomUUID();

    const access_token = await this.generateToken({
      payload: {
        sub: user.id,
        extra: 250,
      },
      secret: accessSignature,
      options: {
        issuer,
        audience: [
          TokenTypeEnum.Access as unknown as string,
          user.role as unknown as string,
        ],
        expiresIn: this.access_token_expires_in,
        jwtid,
      },
    });

    const refresh_token = await this.generateToken({
      payload: {
        sub: user.id,
        extra: 250,
      },
      secret: refreshSignature,
      options: {
        issuer,
        audience: [
          TokenTypeEnum.Refresh as unknown as string,
          user.role as unknown as string,
        ],
        expiresIn: this.refresh_token_expires_in,
        jwtid,
      },
    });
    console.log({
      access_token_expires_in: this.access_token_expires_in,
      refresh_token_expires_in: this.refresh_token_expires_in,
    });
    return { access_token, refresh_token };
  };
}
