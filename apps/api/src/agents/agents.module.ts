import { Module } from '@nestjs/common';

import { ProvidersModule } from '../providers/providers.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [ProvidersModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService]
})
export class AgentsModule {}
