import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from '../routes/queues.routes';

@Module({
  providers: [QueuesService],
  controllers: [QueuesController],
  exports: [QueuesService]
})
export class QueuesModule {}

