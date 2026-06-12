import { Controller, Get, Post, Param } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  findAll() {
    return this.deliveriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveriesService.findOne(id);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId') eventId: string) {
    return this.deliveriesService.findByEvent(eventId);
  }

  @Post(':id/retry')
  retryDelivery(@Param('id') id: string) {
    return this.deliveriesService.retryDelivery(id);
  }
}
