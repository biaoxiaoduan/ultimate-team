import { Module } from '@nestjs/common';

import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [ProvidersController],
  providers: [ProvidersService]
})
export class ProvidersModule {}
