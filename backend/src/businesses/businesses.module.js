import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from '../routes/businesses.routes';

@Module({
  providers: [BusinessesService],
  controllers: [BusinessesController],
})
export class BusinessesModule {}

