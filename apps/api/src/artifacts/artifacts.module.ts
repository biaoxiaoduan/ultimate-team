import { Module } from '@nestjs/common';

import { OrchestrationRunsModule } from '../orchestration-runs/orchestration-runs.module';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';

@Module({
  imports: [OrchestrationRunsModule],
  controllers: [ArtifactsController],
  providers: [ArtifactsService],
  exports: [ArtifactsService]
})
export class ArtifactsModule {}
