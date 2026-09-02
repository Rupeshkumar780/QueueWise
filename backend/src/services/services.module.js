import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from '../routes/services.routes';

@Module({
  providers: [ServicesService],
  controllers: [ServicesController],
})
export class ServicesModule {}

