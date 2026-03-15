import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module';
import { IterationPlansModule } from './iteration-plans/iteration-plans.module';
import { ProvidersModule } from './providers/providers.module';
import { RequirementsModule } from './requirements/requirements.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [HealthModule, WorkspacesModule, ProvidersModule, RequirementsModule, IterationPlansModule]
})
export class AppModule {}
