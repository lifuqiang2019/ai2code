import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

// 形状识别结果接口
export interface ShapeRecognitionResult {
  shapeType: 'Rectangle' | 'Triangle' | 'Circle' | 'Ellipse' | 
             'Diamond' | 'Pentagon' | 'Hexagon' | 'Star' | 
             'Arrow' | 'Heart';
  position: {
    x: number;  // 百分比 0-100
    y: number;  // 百分比 0-100
  };
  size: {
    width: number;   // 百分比 0-100
    height: number;  // 百分比 0-100
  };
  fill: {
    color: string;        // hex 格式
    hasStroke: boolean;
    strokeColor?: string;
    strokeWidth?: number; // 1-10
  };
  transform: {
    rotation: number;  // 0-360
    scaleX: number;    // 0.1-3
    scaleY: number;    // 0.1-3
  };
  zIndex: number;
  opacity: number;  // 0-1
}

export interface RecognitionResponse {
  hasShapes: boolean;
  message?: string;
  shapes?: ShapeRecognitionResult[];
}

@Injectable()
export class ShapeRecognitionService {
  private glmApiKey: string;

  constructor(private configService: ConfigService) {
    this.glmApiKey = this.configService.get('GLM_API_KEY') || '';
  }

  /**
   * 识别图片中的画布形状
   */
  async recognizeShapes(
    imagePath: string,
    canvasWidth: number,
    canvasHeight: number,
  ): Promise<RecognitionResponse> {
    if (!this.glmApiKey) {
      throw new Error('未配置 GLM API Key');
    }

    const prompt = this.buildRecognitionPrompt();

    try {
      const imageUrl = await this.prepareImageUrl(imagePath);
      const result = await this.callGLMVision(imageUrl, prompt);
      
      // 解析 AI 返回的 JSON
      const parsedResult = this.parseAIResponse(result);
      
      // 验证和规范化数据
      if (parsedResult.hasShapes && parsedResult.shapes) {
        parsedResult.shapes = this.normalizeShapes(parsedResult.shapes);
      }

      return parsedResult;
    } catch (error) {
      console.error('形状识别错误:', error);
      throw new Error(`形状识别失败: ${error.message}`);
    }
  }

  /**
   * 构建识别 Prompt
   */
  private buildRecognitionPrompt(): string {
    return `你是一个专业的图形识别助手。请仔细分析这张图片，识别其中的几何形状。

【重要规则】
1. 只识别以下 10 种形状：
   - Rectangle（矩形/正方形）
   - Triangle（三角形）
   - Circle（圆形）
   - Ellipse（椭圆形）
   - Diamond（菱形/旋转45度的正方形）
   - Pentagon（五边形）
   - Hexagon（六边形）
   - Star（五角星）
   - Arrow（箭头）
   - Heart（心形）

2. 如果图片中没有上述任何形状，或者只是普通照片/风景/人物等，直接返回：
   { "hasShapes": false, "message": "图片中未识别到项目相关的几何形状" }

3. 如果识别到形状，返回完整的 JSON 数据，包含：
   - 形状类型
   - 位置（形状中心点，相对于图片的百分比坐标，左上角为0,0，右下角为100,100）
   - 大小（宽度和高度的百分比，相对于图片总大小）
   - 填充颜色（HEX格式，如 #FF0000）
   - 描边信息（是否有边框、边框颜色、边框粗细1-10）
   - 旋转角度（0-360度）
   - 层级关系（通过遮挡判断，被遮挡的在下层，zIndex 数字越大越在上层）
   - 透明度（0-1，0完全透明，1完全不透明）

4. 返回格式（严格 JSON）：
{
  "hasShapes": true,
  "shapes": [
    {
      "shapeType": "Circle",
      "position": { "x": 25, "y": 30 },
      "size": { "width": 15, "height": 15 },
      "fill": {
        "color": "#FF5733",
        "hasStroke": true,
        "strokeColor": "#000000",
        "strokeWidth": 3
      },
      "transform": {
        "rotation": 0,
        "scaleX": 1.0,
        "scaleY": 1.0
      },
      "zIndex": 2,
      "opacity": 1.0
    }
  ]
}

【识别提示】
- **特别注意**：仔细寻找所有形状，包括那些与背景颜色相近的边框形状！
- **浅色边框检测**：如果背景是白色或浅色，要特别留意浅色边框（如白色、灰色边框）的形状，它们可能对比度很低但确实存在
- **边框形状识别**：有些形状可能只有边框没有填充（或填充色与背景相同），这种情况下 fill.color 应该设为白色 #FFFFFF 或透明背景色
- 通过颜色深浅和阴影判断层级关系
- 椭圆和圆形：如果长宽比接近1:1是圆形，否则是椭圆
- 菱形是旋转 45° 的正方形
- 仔细识别每个形状的准确颜色（使用标准 HEX 格式，如 #FF0000）
- 位置使用形状的中心点坐标，size 是形状本身的大小
- strokeWidth 范围是 1-10，根据边框粗细程度判断：1最细（细线），5中等，10最粗
- 如果形状没有边框，hasStroke 为 false，可以省略 strokeColor 和 strokeWidth
- 如果有多个形状重叠，通过视觉判断哪个在上层（看遮挡关系）
- **务必识别图片中的所有几何形状，不要遗漏任何一个**

请严格按照 JSON 格式返回，不要添加任何额外说明文字、markdown 标记或代码块标记。`;
  }

  /**
   * 准备图片 URL（转换为 base64 或使用原 URL）
   */
  private async prepareImageUrl(imagePath: string): Promise<string> {
    // 如果是 URL，直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // 如果已经是 base64
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }

    // 读取本地文件并转换为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = this.getMimeType(imagePath);
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  }

  /**
   * 调用 GLM-4V API
   */
  private async callGLMVision(imageUrl: string, prompt: string): Promise<string> {
    // 最多重试 2 次
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`GLM API 调用尝试 ${attempt + 1}/2...`);
        
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
            temperature: 0.1,  // 降低 temperature 使识别更准确和一致
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.glmApiKey}`,
            },
            timeout: 60000,  // 增加到 60 秒
            maxContentLength: 50 * 1024 * 1024,  // 50MB
            maxBodyLength: 50 * 1024 * 1024,     // 50MB
          },
        );

        console.log('GLM API 调用成功');
        return response.data.choices[0].message.content;
        
      } catch (error) {
        console.error(`GLM API 尝试 ${attempt + 1} 失败:`, error.message);
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === 1) {
          if (error.response) {
            const errorData = error.response.data;
            const errorMsg = errorData.error?.message || errorData.message || error.message;
            throw new Error(`GLM API 调用失败: ${errorMsg}`);
          }
          if (error.code === 'ECONNABORTED') {
            throw new Error(`请求超时: 图片可能太大或网络不稳定`);
          }
          throw new Error(`网络错误: ${error.message}`);
        }
        
        // 等待 2 秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * 解析 AI 返回的 JSON
   */
  private parseAIResponse(aiResponse: string): RecognitionResponse {
    try {
      // 清理可能的 markdown 代码块标记
      let cleaned = aiResponse.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/, '');
      cleaned = cleaned.replace(/```\s*$/, '');
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      // 验证基本结构
      if (typeof parsed.hasShapes !== 'boolean') {
        throw new Error('缺少 hasShapes 字段');
      }

      if (!parsed.hasShapes) {
        return {
          hasShapes: false,
          message: parsed.message || '图片中未识别到项目相关的几何形状',
        };
      }

      if (!Array.isArray(parsed.shapes)) {
        throw new Error('shapes 必须是数组');
      }

      return parsed;
    } catch (error) {
      console.error('AI 返回内容:', aiResponse);
      throw new Error(`JSON 解析失败: ${error.message}`);
    }
  }

  /**
   * 规范化形状数据
   */
  private normalizeShapes(shapes: ShapeRecognitionResult[]): ShapeRecognitionResult[] {
    return shapes.map((shape, index) => {
      // 验证形状类型
      const validTypes = ['Rectangle', 'Triangle', 'Circle', 'Ellipse', 'Diamond', 
                          'Pentagon', 'Hexagon', 'Star', 'Arrow', 'Heart'];
      if (!validTypes.includes(shape.shapeType)) {
        throw new Error(`无效的形状类型: ${shape.shapeType}`);
      }

      // 规范化数值范围
      const normalized: ShapeRecognitionResult = {
        shapeType: shape.shapeType,
        position: {
          x: this.clamp(shape.position?.x ?? 50, 0, 100),
          y: this.clamp(shape.position?.y ?? 50, 0, 100),
        },
        size: {
          width: this.clamp(shape.size?.width ?? 20, 1, 100),
          height: this.clamp(shape.size?.height ?? 20, 1, 100),
        },
        fill: {
          color: this.normalizeColor(shape.fill?.color ?? '#000000'),
          hasStroke: shape.fill?.hasStroke ?? false,
          strokeColor: shape.fill?.hasStroke 
            ? this.normalizeColor(shape.fill?.strokeColor ?? '#000000')
            : undefined,
          strokeWidth: shape.fill?.hasStroke
            ? this.clamp(shape.fill?.strokeWidth ?? 2, 1, 10)
            : undefined,
        },
        transform: {
          rotation: this.clamp(shape.transform?.rotation ?? 0, 0, 360),
          scaleX: this.clamp(shape.transform?.scaleX ?? 1, 0.1, 3),
          scaleY: this.clamp(shape.transform?.scaleY ?? 1, 0.1, 3),
        },
        zIndex: shape.zIndex ?? index + 1,
        opacity: this.clamp(shape.opacity ?? 1, 0, 1),
      };

      return normalized;
    });
  }

  /**
   * 规范化颜色格式
   */
  private normalizeColor(color: string): string {
    // 移除空格
    color = color.trim();

    // 确保是 # 开头的 hex 格式
    if (!color.startsWith('#')) {
      color = '#' + color;
    }

    // 验证格式
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(color)) {
      console.warn(`无效的颜色格式: ${color}，使用默认颜色 #000000`);
      return '#000000';
    }

    return color.toUpperCase();
  }

  /**
   * 限制数值范围
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 获取 MIME 类型
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
}

