import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';

// Imports SubscriptionsModule + DeliveriesModule for event fan-out
// Dependency is one-way: Events → Subscriptions/Deliveries (no circular dep)
@Module({
  imports: [PrismaModule, SubscriptionsModule, DeliveriesModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
