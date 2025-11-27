import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  // 启用 CORS
  app.enableCors();

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`应用正在运行于: http://localhost:${port}/api`);
}
bootstrap();

