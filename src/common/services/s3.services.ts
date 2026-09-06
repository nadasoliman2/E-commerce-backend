import {
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  DeleteObjectsCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import {
  UploadApproachEnum,
  StorageApproachEnum,
} from 'src/common/enums/index';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private AWS_EXPIRE_IN: number;
  private APPLICATION_NAME: string;
  private AWS_BUCKET_NAME: string;
  private AWS_SECRET_ACCESS_KEY: string;
  private AWS_ACCESS_KEY_ID: string;
  private AWS_REGION: string;
  private client: S3Client;

  constructor(private configService: ConfigService) {
    this.AWS_EXPIRE_IN = Number(
      this.configService.get<string>('AWS_EXPIRE_IN'),
    ) as number;
    this.APPLICATION_NAME = this.configService.get<string>(
      'APPLICATION_NAME',
    ) as string;
    this.AWS_BUCKET_NAME = this.configService.get<string>(
      'AWS_BUCKET_NAME',
    ) as string;
    this.AWS_SECRET_ACCESS_KEY = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    ) as string;
    this.AWS_ACCESS_KEY_ID = this.configService.get<string>(
      'AWS_ACCESS_KEY_ID',
    ) as string;
    this.AWS_REGION = this.configService.get<string>('AWS_REGION') as string;
    this.client = new S3Client({
      region: this.AWS_REGION,
      credentials: {
        accessKeyId: this.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket = this.AWS_BUCKET_NAME,
    path = 'general',
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const key = `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket,
      Key: key,
      ACL,
      Body:
        storageApproach === StorageApproachEnum.MEMORY
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype || ContentType,
    });

    await this.client.send(command);

    return key;
  }
  async uploadLargeAsset({
    storageApproach = StorageApproachEnum.DISK,
    Bucket = this.AWS_BUCKET_NAME,
    path = 'general',
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
    partSize = 5,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const key = `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`;

    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: key,
        ACL,
        Body:
          storageApproach === StorageApproachEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype || ContentType,
      },
      partSize: partSize * 1024 * 1024,
    });

    uploadFile.on('httpUploadProgress', (progress) => {
      if (progress.total && progress.loaded !== undefined) {
        console.log(
          `file upload is ${Math.round(
            (progress.loaded / progress.total) * 100,
          )}% done`,
        );
      }
    });

    return await uploadFile.done();
  }
  async uploadAssets({
    uploadApproach = UploadApproachEnum.SMALL,
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket = this.AWS_BUCKET_NAME,
    path = 'general',
    files,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    uploadApproach?: UploadApproachEnum;
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    ContentType?: string;
  }): Promise<string[]> {
    let urls: string[] = [];

    if (uploadApproach === UploadApproachEnum.LARGE) {
      urls = await Promise.all(
        files.map(async (file) => {
          const result = await this.uploadLargeAsset({
            storageApproach,
            Bucket,
            path,
            file,
            ACL,
            ContentType,
          });

          return (result as any).Location || (result as any).Key || '';
        }),
      );
    } else {
      urls = await Promise.all(
        files.map((file) =>
          this.uploadAsset({
            storageApproach,
            Bucket,
            path,
            file,
            ACL,
            ContentType,
          }),
        ),
      );
    }

    return urls;
  }
  async createPreSignedUploadLink({
    Bucket = this.AWS_BUCKET_NAME,
    path = 'general',
    Originalname,
    ContentType,
    expiresIn = this.AWS_EXPIRE_IN,
  }: {
    expiresIn?: number;
    Bucket?: string;
    path?: string;
    Originalname: string;
    ContentType: string | undefined;
  }): Promise<{ url: string; key: string }> {
    const key = `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${Originalname}`;

    const command = new PutObjectCommand({
      Bucket,
      Key: key,
      ContentType,
    });
    if (!command.input.Key) {
      throw new BadRequestException('No file provided');
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, key };
  }
  async createPreSignedFetchLink({
    Bucket = this.AWS_BUCKET_NAME,
    key,
    expiresIn = this.AWS_EXPIRE_IN,
    fileName,
    download,
  }: {
    expiresIn?: number;
    Bucket?: string;
    key: string;
    fileName?: string | undefined;
    download?: string | undefined;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key: key,
      ResponseContentDisposition:
        download === 'true'
          ? `attachment; filename="${fileName || key.split('/').pop()}"`
          : undefined,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return url;
  }
  async getAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }) {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });

    return await this.client.send(command);
  }
  async deleteAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }) {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }
  async deleteAssets({
    Bucket = this.AWS_BUCKET_NAME,
    Keys,
  }: {
    Bucket?: string;
    Keys: { Key: string }[];
  }) {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys,
        Quiet: false,
      },
    });

    return await this.client.send(command);
  }
  async listFolderDir({
    Bucket = this.AWS_BUCKET_NAME,
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${this.APPLICATION_NAME}/${prefix}`,
    });

    return await this.client.send(command);
  }
  async deleteFolderByPrefix({
    Bucket = this.AWS_BUCKET_NAME,
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }) {
    const listedObjects = await this.listFolderDir({ Bucket, prefix });
    const keys =
      listedObjects.Contents?.map(({ Key }) => ({ Key: Key! })) || [];

    return await this.deleteAssets({ Bucket, Keys: keys });
  }
}
