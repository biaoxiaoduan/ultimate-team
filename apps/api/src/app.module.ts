import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module';
import { ProvidersModule } from './providers/providers.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [HealthModule, WorkspacesModule, ProvidersModule]
})
export class AppModule {}
