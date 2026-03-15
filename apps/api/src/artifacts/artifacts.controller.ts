import { Controller, Get, Param, Query } from '@nestjs/common';

import { ArtifactsService } from './artifacts.service';

@Controller()
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Get('artifacts')
  list(@Query('runId') runId?: string, @Query('iterationId') iterationId?: string) {
    return this.artifactsService.list(runId, iterationId);
  }

  @Get('artifacts/run/:runId')
  listByRun(@Param('runId') runId: string) {
    return this.artifactsService.listByRun(runId);
  }

  @Get('artifacts/iteration/:iterationId')
  listByIteration(@Param('iterationId') iterationId: string) {
    return this.artifactsService.listByIteration(iterationId);
  }

  @Get('artifacts/:id')
  getById(@Param('id') id: string) {
    return this.artifactsService.getById(id);
  }

  @Get('test-reports')
  listTestReports(@Query('runId') runId?: string, @Query('iterationId') iterationId?: string) {
    return this.artifactsService.listTestReports(runId, iterationId);
  }

  @Get('build-records')
  listBuildRecords(@Query('runId') runId?: string, @Query('iterationId') iterationId?: string) {
    return this.artifactsService.listBuildRecords(runId, iterationId);
  }
}
