import { Module } from '@nestjs/common';

import { RequirementsModule } from '../requirements/requirements.module';
import { IterationPlansController } from './iteration-plans.controller';
import { IterationPlansService } from './iteration-plans.service';

@Module({
  imports: [RequirementsModule],
  controllers: [IterationPlansController],
  providers: [IterationPlansService],
  exports: [IterationPlansService]
})
export class IterationPlansModule {}
