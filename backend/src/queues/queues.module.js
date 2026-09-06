import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from '../routes/queues.routes';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [QueuesService],
  controllers: [QueuesController],
  exports: [QueuesService]
})
export class QueuesModule {}

