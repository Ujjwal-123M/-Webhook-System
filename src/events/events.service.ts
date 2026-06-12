import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { DeliveryWorker } from '../deliveries/worker/delivery.worker';
import { IngestEventDto } from './dto/ingest-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveryWorker: DeliveryWorker,
  ) {}

  /** Ingest event → find matching subscriptions → create deliveries → trigger worker */
  async ingestEvent(dto: IngestEventDto) {
    const event = await this.prisma.event.create({
      data: {
        type: dto.type,
        payload: JSON.stringify(dto.data),
      },
    });

    const matchingSubs = await this.subscriptionsService.findMatching(dto.type);

    for (const sub of matchingSubs) {
      await this.deliveriesService.createDelivery(sub.id, event.id);
    }

    this.deliveryWorker.processNow();

    return {
      event: {
        id: event.id,
        type: event.type,
        data: dto.data,
        receivedAt: event.receivedAt,
      },
      deliveriesCreated: matchingSubs.length,
    };
  }

  async findAll() {
    const events = await this.prisma.event.findMany({
      orderBy: { receivedAt: 'desc' },
      include: { deliveries: true },
    });
    return events;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { deliveries: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }
}
