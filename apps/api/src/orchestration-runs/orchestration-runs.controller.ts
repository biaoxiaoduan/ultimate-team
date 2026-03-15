import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateOrchestrationRunInput, FailRunStageInput } from './orchestration-run.types';
import { OrchestrationRunsService } from './orchestration-runs.service';

@Controller('orchestration-runs')
export class OrchestrationRunsController {
  constructor(private readonly orchestrationRunsService: OrchestrationRunsService) {}

  @Get()
  list() {
    return this.orchestrationRunsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.orchestrationRunsService.getById(id);
  }

  @Post()
  create(@Body() body: CreateOrchestrationRunInput) {
    return this.orchestrationRunsService.create(body);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.orchestrationRunsService.start(id);
  }

  @Post(':id/stages/:stageId/execute')
  executeStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.orchestrationRunsService.executeStage(id, stageId);
  }

  @Post(':id/stages/:stageId/confirm')
  confirmStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.orchestrationRunsService.confirmStage(id, stageId);
  }

  @Post(':id/stages/:stageId/fail')
  failStage(@Param('id') id: string, @Param('stageId') stageId: string, @Body() body: FailRunStageInput) {
    return this.orchestrationRunsService.failStage(id, stageId, body);
  }

  @Post(':id/stages/:stageId/retry')
  retryStage(@Param('id') id: string, @Param('stageId') stageId: string) {
    return this.orchestrationRunsService.retryStage(id, stageId);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.orchestrationRunsService.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.orchestrationRunsService.resume(id);
  }
}
