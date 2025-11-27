import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import sharp from 'sharp';

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
  imageSize?: {
    width: number;   // 原始图片宽度（像素）
    height: number;  // 原始图片高度（像素）
  };
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
      // 1. 获取原始图片尺寸
      const imageSize = await this.getImageSize(imagePath);
      console.log(`原始图片尺寸: ${imageSize.width}x${imageSize.height}`);
      console.log(`画布尺寸: ${canvasWidth}x${canvasHeight}`);

      // 2. 准备图片 URL（转换为 base64）
      const imageUrl = await this.prepareImageUrl(imagePath);
      
      // 3. 调用 AI 识别
      const result = await this.callGLMVision(imageUrl, prompt);
      
      // 4. 解析 AI 返回的 JSON
      const parsedResult = this.parseAIResponse(result);
      
      // 5. 验证和规范化数据
      if (parsedResult.hasShapes && parsedResult.shapes) {
        parsedResult.shapes = this.normalizeShapes(parsedResult.shapes);
        // 添加原始图片尺寸信息
        parsedResult.imageSize = imageSize;
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

【图片说明】
- 这是一张包含几何形状的截图
- 请基于整张图片来计算形状的位置和大小百分比
- 图片左上角为坐标原点 (0, 0)，右下角为 (100, 100)

【重要规则】
1. 只识别以下 10 种形状（必须严格使用这些名称）：
   - Rectangle（矩形/正方形，注意：正方形也使用 Rectangle，不要使用 Square）
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
      "size": { "width": 15, "height": 15 },  // 注意：圆形的 width 和 height 相等
      "fill": {
        "color": "#FF0000",  // 使用准确的颜色 HEX 值
        "hasStroke": true,
        "strokeColor": "#000000",
        "strokeWidth": 4
      },
      "transform": {
        "rotation": 0,
        "scaleX": 1.0,
        "scaleY": 1.0
      },
      "zIndex": 2,
      "opacity": 1.0
    },
    {
      "shapeType": "Rectangle",
      "position": { "x": 20, "y": 25 },
      "size": { "width": 12, "height": 18 },  // 竖向矩形：height > width
      "fill": {
        "color": "#FFFFFF",  // 空心形状用白色
        "hasStroke": true,
        "strokeColor": "#000000",
        "strokeWidth": 3
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

【识别提示 - 请严格遵守】

1. **形状类型识别**：
   * 有填充色的实心形状（如黑色三角形、红色圆形）
   * 只有边框的空心形状（如黑色边框的矩形）
   * 既有填充又有边框的形状
   * **圆形 vs 椭圆**：仔细观察长宽比，如果接近 1:1（正圆）则是 Circle，否则是 Ellipse

2. **精确测量位置 - 非常重要！**：
   * **坐标系统**：图片左上角为原点 (0, 0)，右下角为 (100, 100)
   * **position.x**：形状几何中心点距离图片左边缘的百分比距离
     - 示例：如果形状中心在图片水平方向的 1/4 处，x = 25
     - 示例：如果形状中心在图片水平方向的正中间，x = 50
   * **position.y**：形状几何中心点距离图片上边缘的百分比距离
     - 示例：如果形状中心在图片垂直方向的 1/5 处，y = 20
   * **测量方法**：
     1. 找到形状的几何中心点（不是视觉重心）
     2. 测量中心点到图片左边缘的距离占图片总宽度的百分比 → x
     3. 测量中心点到图片上边缘的距离占图片总高度的百分比 → y
   * **精度要求**：位置误差应控制在 ±2% 以内

3. **精确测量大小 - 非常重要！**：
   * **size.width**：形状最左边到最右边的宽度占图片总宽度的百分比
     - 测量方法：(形状右边界 - 形状左边界) / 图片总宽度 × 100
   * **size.height**：形状最上边到最下边的高度占图片总高度的百分比
     - 测量方法：(形状下边界 - 形状上边界) / 图片总高度 × 100
   * **关键**：准确测量宽高比例
     - 竖向矩形：height > width（例如 width: 10, height: 15）
     - 横向矩形：width > height（例如 width: 20, height: 12）
     - 正方形：width ≈ height（例如 width: 15, height: 15）
     - 横向椭圆：width > height（例如 width: 18, height: 10）
     - 竖向椭圆：height > width（例如 width: 10, height: 16）
     - 正圆：width = height（例如 width: 12, height: 12）
   * **精度要求**：大小误差应控制在 ±2% 以内

4. **颜色识别**：
   * 实心形状：fill.color 设为实际颜色的准确 HEX 值
     - 棕红色/砖红色：#A0522D、#B8564B、#8B4545
     - 深红色：#A52A2A、暗红色：#8B0000、正红色：#FF0000
     - 黑色：#000000、白色：#FFFFFF、灰色：#808080
   * 空心形状（只有边框）：fill.color 设为 #FFFFFF
   * 边框颜色：准确识别边框的实际颜色

5. **边框识别**：
   * hasStroke：如果有明显边框线条则为 true
   * strokeWidth：根据边框相对粗细判断
     - 3-4：细边框（线条很细）
     - 5-6：中等边框（适中粗细）
     - 7-8：较粗边框
   * strokeColor：边框的准确颜色

6. **位置参考（辅助判断）**：
   * 左上角：x: 10-30, y: 10-30
   * 中上：x: 40-60, y: 10-30
   * 右上角：x: 70-90, y: 10-30
   * 左中：x: 10-30, y: 40-60
   * 正中：x: 40-60, y: 40-60
   * 右中：x: 70-90, y: 40-60
   * 左下：x: 10-30, y: 70-90
   * 中下：x: 40-60, y: 70-90
   * 右下：x: 70-90, y: 70-90

7. **层级关系**：
   * 通过遮挡判断：被遮挡的在下层（zIndex 小），遮挡其他的在上层（zIndex 大）
   * 没有遮挡关系时，zIndex 可以按照从下到上、从左到右的顺序递增

8. **务必识别所有形状，不要遗漏任何一个！**

【返回格式要求 - 极其重要！】
1. **必须返回纯 JSON 格式**，不要添加任何说明文字
2. **不要使用 markdown 代码块标记**（不要用 \`\`\`json 或 \`\`\`）
3. **必须使用双引号**，不要使用单引号
4. **属性名必须加双引号**（如 "shapeType"，不是 shapeType）
5. **不要在 JSON 中添加注释**（不要用 // 或 /* */）
6. **不要在数组或对象最后一项后面加逗号**
7. **数字值不要加引号**（如 25 不是 "25"）
8. **字符串值必须用双引号包裹**（如 "Rectangle"）

返回示例（纯 JSON，无任何额外内容）：
{"hasShapes":true,"shapes":[{"shapeType":"Rectangle","position":{"x":30,"y":20},"size":{"width":15,"height":15},"fill":{"color":"#FFFFFF","hasStroke":true,"strokeColor":"#000000","strokeWidth":4},"transform":{"rotation":0,"scaleX":1.0,"scaleY":1.0},"zIndex":1,"opacity":1.0}]}

请直接返回 JSON，不要有任何其他内容！`;
  }

  /**
   * 获取图片尺寸
   */
  private async getImageSize(imagePath: string): Promise<{ width: number; height: number }> {
    try {
      // 如果是 URL，无法直接获取尺寸，返回默认值
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.warn('URL 图片无法获取尺寸，使用默认值');
        return { width: 800, height: 600 };
      }

      // 如果是 base64，也返回默认值
      if (imagePath.startsWith('data:image')) {
        console.warn('Base64 图片无法获取尺寸，使用默认值');
        return { width: 800, height: 600 };
      }

      // 读取本地文件
      const imageBuffer = fs.readFileSync(imagePath);
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      return {
        width: metadata.width || 800,
        height: metadata.height || 600,
      };
    } catch (error) {
      console.error('获取图片尺寸失败:', error);
      return { width: 800, height: 600 };
    }
  }

  /**
   * 将图片调整到画布尺寸（已废弃，保留代码以备后用）
   * 关键：图片只占画布左上角，其余部分填充白色
   */
  private async adjustImageToCanvasSize(
    imagePath: string,
    canvasWidth: number,
    canvasHeight: number,
  ): Promise<string> {
    try {
      // 如果是 URL，暂时不处理，直接返回
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.warn('URL 图片暂不支持尺寸调整，可能影响识别精度');
        return imagePath;
      }

      // 如果是 base64，暂时不处理
      if (imagePath.startsWith('data:image')) {
        console.warn('Base64 图片暂不支持尺寸调整，可能影响识别精度');
        return imagePath;
      }

      // 读取原始图片信息
      const imageBuffer = fs.readFileSync(imagePath);
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      console.log(`原始图片尺寸: ${originalWidth}x${originalHeight}`);
      console.log(`画布尺寸: ${canvasWidth}x${canvasHeight}`);

      // 如果图片已经和画布一样大（或更大），不需要调整
      if (originalWidth >= canvasWidth && originalHeight >= canvasHeight) {
        console.log('图片尺寸已足够，无需调整');
        return imagePath;
      }

      // 创建一个画布大小的白色背景图片
      const whiteBackground = sharp({
        create: {
          width: canvasWidth,
          height: canvasHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }, // 白色背景
        },
      });

      // 将原图片合成到左上角
      const adjustedImageBuffer = await whiteBackground
        .composite([
          {
            input: imageBuffer,
            top: 0,
            left: 0,
          },
        ])
        .png() // 转换为 PNG 格式
        .toBuffer();

      // 保存临时文件
      const tempPath = imagePath.replace(/\.[^.]+$/, '_canvas_adjusted.png');
      fs.writeFileSync(tempPath, adjustedImageBuffer);

      console.log(`已调整图片到画布尺寸，保存至: ${tempPath}`);
      return tempPath;
    } catch (error) {
      console.error('图片尺寸调整失败:', error);
      // 如果调整失败，返回原路径
      return imagePath;
    }
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
      // 1. 清理 markdown 代码块标记
      let cleaned = aiResponse.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/, '');
      cleaned = cleaned.replace(/```\s*$/, '');
      cleaned = cleaned.trim();

      // 2. 清理注释（// 和 /* */ 格式）
      cleaned = cleaned.replace(/\/\/[^\n]*/g, '');  // 单行注释
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');  // 多行注释

      // 3. 尝试修复常见的 JSON 格式问题
      // 移除末尾的逗号（trailing comma）
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      // 4. 如果 JSON 中有单引号，尝试替换为双引号（仅对属性名和字符串值）
      // 注意：这是一个简化的处理，可能不完美
      cleaned = cleaned.replace(/'/g, '"');

      // 5. 打印清理后的内容用于调试
      console.log('清理后的 JSON:', cleaned.substring(0, 500) + (cleaned.length > 500 ? '...' : ''));

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
      // 容错处理：将 AI 可能返回的其他名称转换为标准名称
      let shapeType = shape.shapeType;
      if (shapeType === 'Square' as any) {
        shapeType = 'Rectangle';  // 正方形统一使用 Rectangle
      }
      
      // 验证形状类型
      const validTypes = ['Rectangle', 'Triangle', 'Circle', 'Ellipse', 'Diamond', 
                          'Pentagon', 'Hexagon', 'Star', 'Arrow', 'Heart'];
      if (!validTypes.includes(shapeType)) {
        throw new Error(`无效的形状类型: ${shape.shapeType}，请使用: ${validTypes.join(', ')}`);
      }

      // 规范化数值范围
      const normalized: ShapeRecognitionResult = {
        shapeType: shapeType,
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
            ? this.clamp(shape.fill?.strokeWidth ?? 4, 3, 10)  // 最小值改为 3，默认值改为 4
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

