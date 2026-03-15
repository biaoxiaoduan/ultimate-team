import { Controller, Get, Param, Post } from '@nestjs/common';

import { IterationPlansService } from './iteration-plans.service';

@Controller()
export class IterationPlansController {
  constructor(private readonly iterationPlansService: IterationPlansService) {}

  @Get('iteration-plans')
  list() {
    return this.iterationPlansService.list();
  }

  @Get('iteration-plans/:id')
  getById(@Param('id') id: string) {
    return this.iterationPlansService.getById(id);
  }

  @Post('requirements/:id/generate-plan')
  generate(@Param('id') id: string) {
    return this.iterationPlansService.generateDraft(id);
  }

  @Post('iteration-plans/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.iterationPlansService.confirm(id);
  }
}
