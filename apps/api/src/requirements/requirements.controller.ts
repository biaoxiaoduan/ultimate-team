import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import {
  CreateRequirementInput,
  CreateRequirementVersionInput,
  UpdateRequirementInput
} from './requirement.types';
import { RequirementsService } from './requirements.service';

@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Get()
  list() {
    return this.requirementsService.list();
  }

  @Post()
  create(@Body() body: CreateRequirementInput) {
    return this.requirementsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateRequirementInput) {
    return this.requirementsService.update(id, body);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.requirementsService.listVersions(id);
  }

  @Post(':id/versions')
  addVersion(@Param('id') id: string, @Body() body: CreateRequirementVersionInput) {
    return this.requirementsService.addVersion(id, body);
  }
}
