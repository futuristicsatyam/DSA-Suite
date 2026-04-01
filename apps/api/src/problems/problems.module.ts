import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { Judge0Service } from './judge0.service';

@Module({
  controllers: [ProblemsController],
  providers: [ProblemsService, Judge0Service],
  exports: [ProblemsService],
})
export class ProblemsModule {}
