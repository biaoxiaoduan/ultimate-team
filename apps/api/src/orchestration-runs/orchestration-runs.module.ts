import { Module } from '@nestjs/common';

import { AgentsModule } from '../agents/agents.module';
import { IterationPlansModule } from '../iteration-plans/iteration-plans.module';
import { OrchestrationRunsController } from './orchestration-runs.controller';
import { OrchestrationRunsService } from './orchestration-runs.service';

@Module({
  imports: [IterationPlansModule, AgentsModule],
  controllers: [OrchestrationRunsController],
  providers: [OrchestrationRunsService],
  exports: [OrchestrationRunsService]
})
export class OrchestrationRunsModule {}
