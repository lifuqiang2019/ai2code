import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LangchainService } from './langchain.service';
import { ImageAnalysisService } from './services/image-analysis.service';
import { ShapeRecognitionService } from './services/shape-recognition.service';

@Controller('langchain')
export class LangchainController {
  constructor(
    private readonly langchainService: LangchainService,
    private readonly imageAnalysisService: ImageAnalysisService,
    private readonly shapeRecognitionService: ShapeRecognitionService,
  ) {}

  /**
   * 简单聊天接口
   */
  @Post('chat')
  async chat(@Body() body: { message: string }) {
    if (!body.message) {
      throw new BadRequestException('消息内容不能为空');
    }

    const response = await this.langchainService.chat(body.message);
    return {
      success: true,
      data: {
        message: response,
      },
    };
  }

  /**
   * 图片识别接口 - 通过 URL
   */
  @Post('analyze-image-url')
  async analyzeImageUrl(
    @Body() body: { imageUrl: string; question?: string },
  ) {
    if (!body.imageUrl) {
      throw new BadRequestException('图片 URL 不能为空');
    }

    const result = await this.imageAnalysisService.analyzeImage(
      body.imageUrl,
      body.question,
    );

    return {
      success: true,
      data: {
        analysis: result,
      },
    };
  }

  /**
   * 图片识别接口 - 通过上传文件
   */
  @Post('analyze-image-upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp)$/)) {
          return cb(new BadRequestException('只支持图片格式！'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async analyzeImageUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { question?: string },
  ) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    const result = await this.imageAnalysisService.analyzeImage(
      file.path,
      body.question,
    );

    return {
      success: true,
      data: {
        filename: file.filename,
        analysis: result,
      },
    };
  }

  /**
   * OCR 文字提取接口
   */
  @Post('ocr')
  async extractText(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) {
      throw new BadRequestException('图片 URL 不能为空');
    }

    const result = await this.imageAnalysisService.extractTextFromImage(
      body.imageUrl,
    );

    return {
      success: true,
      data: {
        text: result,
      },
    };
  }

  /**
   * 对象检测接口
   */
  @Post('detect-objects')
  async detectObjects(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) {
      throw new BadRequestException('图片 URL 不能为空');
    }

    const result = await this.imageAnalysisService.detectObjects(body.imageUrl);

    return {
      success: true,
      data: {
        objects: result,
      },
    };
  }

  /**
   * 使用 LangChain 工具进行图片分析
   */
  @Post('analyze-with-agent')
  async analyzeWithAgent(
    @Body() body: { imageUrl: string; task: string },
  ) {
    if (!body.imageUrl || !body.task) {
      throw new BadRequestException('图片 URL 和任务描述不能为空');
    }

    // 这里可以集成 LangChain Agent 来处理更复杂的任务
    const result = await this.imageAnalysisService.analyzeImage(
      body.imageUrl,
      body.task,
    );

    return {
      success: true,
      data: {
        result,
      },
    };
  }

  /**
   * 识别画布形状 - 文件上传方式
   */
  @Post('recognize-canvas-shapes')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp)$/)) {
          return cb(new BadRequestException('只支持图片格式！'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async recognizeCanvasShapes(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { canvasWidth: string; canvasHeight: string },
  ) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    const canvasWidth = parseInt(body.canvasWidth, 10);
    const canvasHeight = parseInt(body.canvasHeight, 10);

    if (isNaN(canvasWidth) || isNaN(canvasHeight)) {
      throw new BadRequestException('画布尺寸无效');
    }

    try {
      const result = await this.shapeRecognitionService.recognizeShapes(
        file.path,
        canvasWidth,
        canvasHeight,
      );

      if (!result.hasShapes) {
        return {
          success: false,
          message: result.message || '图片中未识别到项目相关的几何形状',
        };
      }

      return {
        success: true,
        data: {
          shapes: result.shapes,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 识别画布形状 - URL 方式
   */
  @Post('recognize-canvas-shapes-url')
  async recognizeCanvasShapesFromUrl(
    @Body()
    body: {
      imageUrl: string;
      canvasWidth: number;
      canvasHeight: number;
    },
  ) {
    if (!body.imageUrl) {
      throw new BadRequestException('图片 URL 不能为空');
    }

    if (!body.canvasWidth || !body.canvasHeight) {
      throw new BadRequestException('画布尺寸不能为空');
    }

    try {
      const result = await this.shapeRecognitionService.recognizeShapes(
        body.imageUrl,
        body.canvasWidth,
        body.canvasHeight,
      );

      if (!result.hasShapes) {
        return {
          success: false,
          message: result.message || '图片中未识别到项目相关的几何形状',
        };
      }

      return {
        success: true,
        data: {
          shapes: result.shapes,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

