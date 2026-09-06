import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { S3Service } from 'src/common/services';
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

const s3WriteStream = promisify(pipeline);

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('uploads/*path')
  async getFile(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { download, fileName } = req.query as {
      download?: string;
      fileName?: string;
    };

    const { path } = req.params as {
      path: string[];
    };

    const link = path.join('/');

    const { Body, ContentType } = await this.s3Service.getAsset({
      Key: link,
    });

    res.setHeader('Content-Type', ContentType || 'application/octet-stream');

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (download === 'true') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName || link.split('/').pop()}"`,
      );
    }

    await s3WriteStream(Body as NodeJS.ReadableStream, res);
  }

  @Get('pre-signed/*path')
  async getPreSigned(@Req() req: Request) {
    const { download, fileName } = req.query as {
      download?: string;
      fileName?: string;
    };

    const { path } = req.params as {
      path: string[];
    };

    const link = path.join('/');

    return this.s3Service.createPreSignedFetchLink({
      key: link,
      download,
      fileName,
    });
  }
}
