import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { ShapeRecognitionResult } from './shape-recognition.service';

export interface TextToShapeResponse {
  hasShapes: boolean;
  message?: string;
  shapes?: ShapeRecognitionResult[];
}

@Injectable()
export class TextToShapeService {
  private glmApiKey: string;

  constructor(private configService: ConfigService) {
    this.glmApiKey = this.configService.get('GLM_API_KEY') || '';
  }

  /**
   * 根据文本描述生成形状
   */
  async generateShapesFromText(
    userInput: string,
    canvasWidth: number,
    canvasHeight: number,
  ): Promise<TextToShapeResponse> {
    if (!this.glmApiKey) {
      throw new Error('未配置 GLM API Key');
    }

    const prompt = this.buildTextToShapePrompt(userInput, canvasWidth, canvasHeight);

    try {
      const result = await this.callGLMAPI(prompt);
      const parsedResult = this.parseAIResponse(result);

      // 验证和规范化数据
      if (parsedResult.hasShapes && parsedResult.shapes) {
        parsedResult.shapes = this.normalizeShapes(parsedResult.shapes);
      }

      return parsedResult;
    } catch (error) {
      console.error('文本生成形状错误:', error);
      throw new Error(`文本生成形状失败: ${error.message}`);
    }
  }

  /**
   * 构建文本转形状的 Prompt
   */
  private buildTextToShapePrompt(userInput: string, canvasWidth: number, canvasHeight: number): string {
    return `你是一个专业的图形设计助手。用户会用自然语言描述想要创建的图形，你需要将这些描述转换为具体的形状数据。

【画布信息】
- 画布尺寸：${canvasWidth} × ${canvasHeight} 像素
- 坐标系统：左上角为原点 (0, 0)，右下角为 (100, 100)
- 所有位置和大小使用百分比表示

【用户描述】
${userInput}

【支持的形状类型】
1. Rectangle - 矩形/正方形
2. Triangle - 三角形
3. Circle - 圆形
4. Ellipse - 椭圆形
5. Diamond - 菱形
6. Pentagon - 五边形
7. Hexagon - 六边形
8. Star - 五角星
9. Arrow - 箭头
10. Heart - 心形

【颜色参考】
- 红色: #FF0000, #DC143C, #FF6347
- 蓝色: #0000FF, #4169E1, #1E90FF
- 绿色: #00FF00, #32CD32, #90EE90
- 黄色: #FFFF00, #FFD700, #FFA500
- 黑色: #000000
- 白色: #FFFFFF
- 灰色: #808080, #A9A9A9
- 粉色: #FFC0CB, #FF69B4
- 紫色: #800080, #9370DB

【位置参考】
- 左上角: x: 15-25, y: 15-25
- 中上: x: 45-55, y: 15-25
- 右上角: x: 75-85, y: 15-25
- 左中: x: 15-25, y: 45-55
- 正中: x: 45-55, y: 45-55
- 右中: x: 75-85, y: 45-55
- 左下: x: 15-25, y: 75-85
- 中下: x: 45-55, y: 75-85
- 右下: x: 75-85, y: 75-85

【大小参考】
- 小: width/height: 8-15
- 中: width/height: 15-25
- 大: width/height: 25-40
- 特大: width/height: 40-60

【生成规则】
1. 根据用户描述创建合适的形状
2. 如果用户指定了颜色，使用对应的 HEX 值
3. 如果用户指定了位置，使用合适的坐标
4. 如果用户指定了大小，使用合适的百分比
5. 如果用户没有指定，使用合理的默认值：
   - 位置：分散排列，不要重叠
   - 大小：中等大小（15-25）
   - 颜色：随机但协调的颜色
6. 边框：如果用户要求"空心"或"只有边框"，设置 hasStroke: true, fill.color: "#FFFFFF"
7. 填充：如果用户要求"实心"或指定颜色，设置对应的 fill.color
8. 层级：按创建顺序设置 zIndex（1, 2, 3...）

【返回格式】
必须返回严格的 JSON 格式（不要有任何其他内容）：

{
  "hasShapes": true,
  "shapes": [
    {
      "shapeType": "Circle",
      "position": {"x": 30, "y": 30},
      "size": {"width": 20, "height": 20},
      "fill": {
        "color": "#FF0000",
        "hasStroke": true,
        "strokeColor": "#000000",
        "strokeWidth": 4
      },
      "transform": {
        "rotation": 0,
        "scaleX": 1.0,
        "scaleY": 1.0
      },
      "zIndex": 1,
      "opacity": 1.0
    }
  ]
}

【示例】
用户输入："画一个红色的圆形在左上角，一个蓝色的矩形在右下角"
返回：
{
  "hasShapes": true,
  "shapes": [
    {
      "shapeType": "Circle",
      "position": {"x": 20, "y": 20},
      "size": {"width": 18, "height": 18},
      "fill": {"color": "#FF0000", "hasStroke": false},
      "transform": {"rotation": 0, "scaleX": 1.0, "scaleY": 1.0},
      "zIndex": 1,
      "opacity": 1.0
    },
    {
      "shapeType": "Rectangle",
      "position": {"x": 80, "y": 80},
      "size": {"width": 20, "height": 15},
      "fill": {"color": "#0000FF", "hasStroke": false},
      "transform": {"rotation": 0, "scaleX": 1.0, "scaleY": 1.0},
      "zIndex": 2,
      "opacity": 1.0
    }
  ]
}

请直接返回 JSON，不要有任何额外内容！`;
  }

  /**
   * 调用 GLM API
   */
  private async callGLMAPI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4-flash',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,  // 稍高的温度以获得更有创意的结果
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.glmApiKey}`,
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData.error?.message || errorData.message || error.message;
        throw new Error(`GLM API 调用失败: ${errorMsg}`);
      }
      throw new Error(`网络错误: ${error.message}`);
    }
  }

  /**
   * 解析 AI 返回的 JSON
   */
  private parseAIResponse(aiResponse: string): TextToShapeResponse {
    try {
      // 清理 markdown 代码块标记
      let cleaned = aiResponse.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/, '');
      cleaned = cleaned.replace(/```\s*$/, '');
      cleaned = cleaned.trim();

      // 清理注释
      cleaned = cleaned.replace(/\/\/[^\n]*/g, '');
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

      // 移除末尾逗号
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      // 替换单引号为双引号
      cleaned = cleaned.replace(/'/g, '"');

      console.log('清理后的 JSON:', cleaned.substring(0, 500));

      const parsed = JSON.parse(cleaned);

      if (typeof parsed.hasShapes !== 'boolean') {
        throw new Error('缺少 hasShapes 字段');
      }

      if (!parsed.hasShapes) {
        return {
          hasShapes: false,
          message: parsed.message || '无法根据描述生成形状',
        };
      }

      if (!Array.isArray(parsed.shapes)) {
        throw new Error('shapes 必须是数组');
      }

      return parsed;
    } catch (error) {
      console.error('==================== JSON 解析错误 ====================');
      console.error('原始 AI 返回内容:');
      console.error(aiResponse);
      console.error('======================================================');
      throw new Error(`JSON 解析失败: ${error.message}`);
    }
  }

  /**
   * 规范化形状数据
   */
  private normalizeShapes(shapes: ShapeRecognitionResult[]): ShapeRecognitionResult[] {
    return shapes.map((shape, index) => {
      // 容错处理
      let shapeType = shape.shapeType;
      if (shapeType === 'Square' as any) {
        shapeType = 'Rectangle';
      }

      // 验证形状类型
      const validTypes = ['Rectangle', 'Triangle', 'Circle', 'Ellipse', 'Diamond',
        'Pentagon', 'Hexagon', 'Star', 'Arrow', 'Heart'];
      if (!validTypes.includes(shapeType)) {
        throw new Error(`无效的形状类型: ${shape.shapeType}`);
      }

      return {
        shapeType,
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
            ? this.clamp(shape.fill?.strokeWidth ?? 4, 3, 10)
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
    });
  }

  /**
   * 规范化颜色格式
   */
  private normalizeColor(color: string): string {
    color = color.trim();

    if (!color.startsWith('#')) {
      color = '#' + color;
    }

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
}

