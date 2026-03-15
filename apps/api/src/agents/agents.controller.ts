import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { AgentsService } from './agents.service';
import { CreateAgentInput, UpdateAgentInput } from './agent.types';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('templates')
  listTemplates() {
    return this.agentsService.listTemplates();
  }

  @Get('instances')
  listInstances() {
    return this.agentsService.listInstances();
  }

  @Post('instances')
  create(@Body() body: CreateAgentInput) {
    return this.agentsService.create(body);
  }

  @Patch('instances/:id')
  update(@Param('id') id: string, @Body() body: UpdateAgentInput) {
    return this.agentsService.update(id, body);
  }

  @Delete('instances/:id')
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}
