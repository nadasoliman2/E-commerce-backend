import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  WatchInterceptor,
  LanguageInterceptor,
  TransformInterceptor,
} from 'src/common/interceptor/index';
import * as express from 'express';
import { resolve } from 'path';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  app.use('/upload', express.static(resolve(`./uploads`)));
  app.useGlobalInterceptors(
    new WatchInterceptor(),
    new LanguageInterceptor(),
    new TransformInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const PORT = process.env.PORT ?? 5000;
  await app.listen(PORT, () => {
    console.log(`server is running on port${PORT} `);
  });
}
void bootstrap();
