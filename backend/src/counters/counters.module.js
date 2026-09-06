import { Module } from '@nestjs/common';
import { CountersService } from './counters.service';
import { CountersController } from '../routes/counters.routes';

import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [CountersService],
  controllers: [CountersController],
})
export class CountersModule {}

