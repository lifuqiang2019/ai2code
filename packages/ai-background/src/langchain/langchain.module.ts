import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { ImageAnalysisService } from './services/image-analysis.service';

@Module({
  controllers: [LangchainController],
  providers: [LangchainService, ImageAnalysisService],
  exports: [LangchainService, ImageAnalysisService],
})
export class LangchainModule {}

