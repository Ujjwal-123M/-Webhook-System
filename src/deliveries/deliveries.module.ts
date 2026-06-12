import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveryWorker } from './worker/delivery.worker';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, DeliveryWorker],
  exports: [DeliveriesService, DeliveryWorker], // EventsModule needs both for fan-out
})
export class DeliveriesModule {}
