import { Module } from '@nestjs/common';
import { CountersService } from './counters.service';
import { CountersController } from '../routes/counters.routes';

@Module({
  providers: [CountersService],
  controllers: [CountersController],
})
export class CountersModule {}

