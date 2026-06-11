import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
