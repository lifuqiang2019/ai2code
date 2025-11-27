import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { ImageAnalysisService } from './services/image-analysis.service';
import { ShapeRecognitionService } from './services/shape-recognition.service';
import { TextToShapeService } from './services/text-to-shape.service';

@Module({
  controllers: [LangchainController],
  providers: [
    LangchainService,
    ImageAnalysisService,
    ShapeRecognitionService,
    TextToShapeService,
  ],
  exports: [
    LangchainService,
    ImageAnalysisService,
    ShapeRecognitionService,
    TextToShapeService,
  ],
})
export class LangchainModule {}

