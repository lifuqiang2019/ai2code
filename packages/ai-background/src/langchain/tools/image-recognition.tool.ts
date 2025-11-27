import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ImageAnalysisService } from '../services/image-analysis.service';

/**
 * 创建图片识别工具
 */
export function createImageRecognitionTool(
  imageAnalysisService: ImageAnalysisService,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'image_recognition',
    description: '识别和分析图片内容的工具。可以描述图片内容、提取文字、识别对象等。',
    schema: z.object({
      imagePath: z.string().describe('图片的文件路径或 URL'),
      question: z.string().optional().describe('对图片的具体提问（可选）'),
    }),
    func: async ({ imagePath, question }) => {
      try {
        const result = await imageAnalysisService.analyzeImage(
          imagePath,
          question,
        );
        return result;
      } catch (error) {
        return `图片识别失败: ${error.message}`;
      }
    },
  });
}

/**
 * 创建 OCR（文字提取）工具
 */
export function createOCRTool(
  imageAnalysisService: ImageAnalysisService,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'ocr_text_extraction',
    description: '从图片中提取文字内容的工具（OCR）。',
    schema: z.object({
      imagePath: z.string().describe('图片的文件路径或 URL'),
    }),
    func: async ({ imagePath }) => {
      try {
        const result = await imageAnalysisService.extractTextFromImage(imagePath);
        return result;
      } catch (error) {
        return `文字提取失败: ${error.message}`;
      }
    },
  });
}

/**
 * 创建对象检测工具
 */
export function createObjectDetectionTool(
  imageAnalysisService: ImageAnalysisService,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'object_detection',
    description: '检测和识别图片中的对象、物品的工具。',
    schema: z.object({
      imagePath: z.string().describe('图片的文件路径或 URL'),
    }),
    func: async ({ imagePath }) => {
      try {
        const result = await imageAnalysisService.detectObjects(imagePath);
        return result;
      } catch (error) {
        return `对象检测失败: ${error.message}`;
      }
    },
  });
}

