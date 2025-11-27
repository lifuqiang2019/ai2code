import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class LangchainService {
  private model: ChatOpenAI;

  constructor(private configService: ConfigService) {
    // 配置 DeepSeek 模型（使用 OpenAI 兼容接口）
    this.model = new ChatOpenAI({
      modelName: 'deepseek-chat',
      openAIApiKey: this.configService.get('DEEPSEEK_API_KEY'),
      configuration: {
        baseURL: this.configService.get('DEEPSEEK_BASE_URL'),
      },
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  /**
   * 发送简单文本消息
   */
  async chat(message: string): Promise<string> {
    try {
      const response = await this.model.invoke([
        new HumanMessage(message),
      ]);
      return response.content.toString();
    } catch (error) {
      throw new Error(`聊天失败: ${error.message}`);
    }
  }

  /**
   * 获取模型实例
   */
  getModel(): ChatOpenAI {
    return this.model;
  }
}

