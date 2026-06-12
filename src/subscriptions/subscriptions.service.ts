import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const { targetUrl, eventTypes, secret } = createSubscriptionDto;
    const subscription = await this.prisma.subscription.create({
      data: {
        targetUrl,
        eventTypes: JSON.stringify(eventTypes), // SQLite has no array type
        secret,
      },
    });
    return {
      ...subscription,
      eventTypes: JSON.parse(subscription.eventTypes),
    };
  }

  async findAll() {
    const subscriptions = await this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return subscriptions.map((sub) => ({
      ...sub,
      eventTypes: JSON.parse(sub.eventTypes),
    }));
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return {
      ...subscription,
      eventTypes: JSON.parse(subscription.eventTypes),
    };
  }

  async remove(id: string) {
    await this.prisma.subscription.delete({
      where: { id },
    });
    return { message: `Subscription with ID ${id} deleted` };
  }

  /** Find subscriptions whose eventTypes pattern matches the given event type.
   *  Filtering in JS because SQLite has no native JSON array querying. */
  async findMatching(eventType: string) {
    const subscriptions = await this.prisma.subscription.findMany();
    return subscriptions.filter((sub) => {
      const patterns: string[] = JSON.parse(sub.eventTypes);
      return patterns.some((pattern) => {
        if (pattern === '*') return true;
        if (pattern === eventType) return true;
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return eventType.startsWith(prefix);
        }
        return false;
      });
    });
  }
}
