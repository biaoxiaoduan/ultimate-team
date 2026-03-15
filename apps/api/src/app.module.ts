import { Module } from '@nestjs/common';

import { ArtifactsModule } from './artifacts/artifacts.module';
import { AgentsModule } from './agents/agents.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IterationPlansModule } from './iteration-plans/iteration-plans.module';
import { OrchestrationRunsModule } from './orchestration-runs/orchestration-runs.module';
import { ProvidersModule } from './providers/providers.module';
import { RequirementsModule } from './requirements/requirements.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    DatabaseModule,
    ArtifactsModule,
    HealthModule,
    WorkspacesModule,
    ProvidersModule,
    RequirementsModule,
    IterationPlansModule,
    AgentsModule,
    OrchestrationRunsModule
  ]
})
export class AppModule {}
