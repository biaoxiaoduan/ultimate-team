import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateWorkspaceInput } from './workspace.types';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  list() {
    return this.workspacesService.list();
  }

  @Post()
  create(@Body() body: CreateWorkspaceInput) {
    return this.workspacesService.create(body);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string) {
    return this.workspacesService.setDefault(id);
  }
}
