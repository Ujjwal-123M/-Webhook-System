import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryWorker } from './worker/delivery.worker';

// Delivery lifecycle: pending → in_flight → delivered | failed
@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryWorker: DeliveryWorker,
  ) {}

  async createDelivery(subscriptionId: string, eventId: string) {
    const delivery = await this.prisma.delivery.create({
      data: {
        subscriptionId,
        eventId,
        status: 'pending',
      },
    });
    return delivery;
  }

  async findAll() {
    const deliveries = await this.prisma.delivery.findMany({
      include: { subscription: true, event: true },
      orderBy: { createdAt: 'desc' },
    });
    return deliveries;
  }

  async findOne(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { subscription: true, event: true, attemptLogs: true },
    });
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return delivery;
  }

  async findByEvent(eventId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { eventId },
      include: { subscription: true, attemptLogs: true },
    });
    return deliveries;
  }

  /** Reset a failed delivery back to pending — the worker polling loop picks it up automatically */
  async retryDelivery(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    });
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    if (delivery.status !== 'failed') {
      throw new Error(`Only failed deliveries can be retried`);
    }
    await this.prisma.delivery.update({
      where: { id },
      data: {
        status: 'pending',
        nextRetryAt: new Date(),
        attempts: 0,
      },
    });

    this.deliveryWorker.processNow();

    return await this.prisma.delivery.findUnique({ where: { id } });
  }
}
