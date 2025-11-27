import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { ImageAnalysisService } from './services/image-analysis.service';
import { ShapeRecognitionService } from './services/shape-recognition.service';

@Module({
  controllers: [LangchainController],
  providers: [LangchainService, ImageAnalysisService, ShapeRecognitionService],
  exports: [LangchainService, ImageAnalysisService, ShapeRecognitionService],
})
export class LangchainModule {}

