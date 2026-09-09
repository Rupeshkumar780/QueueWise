import { Module } from '@nestjs/common';
import { QueueEntriesService } from './queue-entries.service';
import { QueueEntriesController } from '../routes/queue-entries.routes';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [EventsModule, RedisModule],
  providers: [QueueEntriesService],
  controllers: [QueueEntriesController],
  exports: [QueueEntriesService]
})
export class QueueEntriesModule {}

