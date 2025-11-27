import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

@Injectable()
export class ImageAnalysisService {
  private deepseekApiKey: string;
  private deepseekBaseUrl: string;
  private glmApiKey: string;

  constructor(private configService: ConfigService) {
    this.deepseekApiKey = this.configService.get('DEEPSEEK_API_KEY');
    this.deepseekBaseUrl = this.configService.get('DEEPSEEK_BASE_URL');
    this.glmApiKey = this.configService.get('GLM_API_KEY') || '';
    
    console.log('ImageAnalysisService 初始化:');
    console.log('- DeepSeek API Key:', this.deepseekApiKey ? '已配置（文本对话）' : '未配置');
    console.log('- GLM-4V API Key:', this.glmApiKey ? '已配置（图片识别）' : '未配置');
  }

  /**
   * 分析图片内容
   * @param imagePath 图片文件路径或 base64 编码
   * @param question 对图片的提问（可选）
   */
  async analyzeImage(
    imagePath: string,
    question?: string,
  ): Promise<string> {
    // 检查是否配置了 GLM API Key
    if (!this.glmApiKey) {
      return '⚠️ 未配置图片识别服务。\n\n请在 .env 文件中添加智谱 GLM-4V API Key：\nGLM_API_KEY=your_key\n\n当前可用功能：\n- 智能对话（使用 DeepSeek）\n- 文本处理和分析';
    }

    const prompt = question || '请详细描述这张图片的内容。';

    try {
      return await this.analyzeWithGLM(imagePath, prompt);
    } catch (error) {
      console.error('图片分析错误详情:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 使用智谱 GLM-4V 分析图片
   */
  private async analyzeWithGLM(
    imagePath: string,
    prompt: string,
  ): Promise<string> {
    try {
      let imageUrl: string;
      
      if (imagePath.startsWith('data:image')) {
        imageUrl = imagePath;
      } else if (imagePath.startsWith('http')) {
        imageUrl = imagePath;
      } else {
        const imageBuffer = fs.readFileSync(imagePath);
        const mimeType = this.getMimeType(imagePath);
        imageUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      }

      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4v-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.glmApiKey}`,
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData.error?.message || errorData.message || error.message;
        throw new Error(`图片分析失败: ${errorMsg}`);
      }
      throw new Error(`图片分析失败: ${error.message}`);
    }
  }


  /**
   * 根据文件扩展名获取 MIME 类型
   */
  private getMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  /**
   * 比较两张图片
   */
  async compareImages(
    imagePath1: string,
    imagePath2: string,
  ): Promise<string> {
    return this.analyzeImage(
      imagePath1,
      '请比较这两张图片的异同。注意：第二张图片将在下一条消息中提供。',
    );
  }

  /**
   * 提取图片中的文字（OCR）
   */
  async extractTextFromImage(imagePath: string): Promise<string> {
    return this.analyzeImage(
      imagePath,
      '请识别并提取这张图片中的所有文字内容，保持原有的格式和排版。',
    );
  }

  /**
   * 识别图片中的对象
   */
  async detectObjects(imagePath: string): Promise<string> {
    return this.analyzeImage(
      imagePath,
      '请识别并列出这张图片中的所有对象、物品和元素。',
    );
  }
}

