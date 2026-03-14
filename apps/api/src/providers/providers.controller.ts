import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateProviderInput, UpdateProviderInput } from './provider.types';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  list() {
    return this.providersService.list();
  }

  @Post()
  create(@Body() body: CreateProviderInput) {
    return this.providersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProviderInput) {
    return this.providersService.update(id, body);
  }
}
