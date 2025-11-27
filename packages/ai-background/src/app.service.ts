import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '欢迎使用 LangChain + NestJS + DeepSeek 图片识别服务！';
  }
}

