/**
 * AI 图片识别服务 - API 调用层
 */

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
  success: boolean;
  message?: string;
  data?: {
    shapes: ShapeRecognitionResult[];
  };
}

const API_BASE_URL = 'http://localhost:3000';

/**
 * 识别图片中的形状 - 文件上传方式
 */
export async function recognizeShapesFromFile(
  file: File,
  canvasWidth: number,
  canvasHeight: number,
): Promise<RecognitionResponse> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('canvasWidth', canvasWidth.toString());
    formData.append('canvasHeight', canvasHeight.toString());

    const response = await fetch(`${API_BASE_URL}/langchain/recognize-canvas-shapes`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '识别失败');
    }

    return await response.json();
  } catch (error) {
    console.error('识别图片失败:', error);
    throw error;
  }
}

/**
 * 识别图片中的形状 - URL 方式
 */
export async function recognizeShapesFromUrl(
  imageUrl: string,
  canvasWidth: number,
  canvasHeight: number,
): Promise<RecognitionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/langchain/recognize-canvas-shapes-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        canvasWidth,
        canvasHeight,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '识别失败');
    }

    return await response.json();
  } catch (error) {
    console.error('识别图片失败:', error);
    throw error;
  }
}

