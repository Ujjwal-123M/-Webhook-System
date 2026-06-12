import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

/**
 * Background worker that polls for pending deliveries and sends webhooks.
 *
 * - Polls every POLL_INTERVAL_MS via setInterval
 * - Retries with exponential backoff + jitter
 * - Recovers in_flight deliveries on startup (at-least-once guarantee)
 * - Signs payloads with HMAC-SHA256 when subscription has a secret
 */
@Injectable()
export class DeliveryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryWorker.name);
  private intervalRef: NodeJS.Timeout | null = null;

  private readonly POLL_INTERVAL_MS = 5000;
  private readonly BASE_DELAY_MS = 30_000;
  private readonly MAX_JITTER_MS = 5_000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Recover any deliveries stuck as in_flight from a previous crash
    await this.prisma.delivery.updateMany({
      where: { status: 'in_flight' },
      data: { status: 'pending' },
    });
    this.intervalRef = setInterval(() => this.tick(), this.POLL_INTERVAL_MS);
    this.logger.log('Delivery worker started');
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.logger.log('Delivery worker stopped');
    }
  }

  /** Fire-and-forget trigger for immediate processing after fan-out */
  processNow() {
    this.tick().catch((error) => {
      this.logger.error('Error in processNow:', error);
    });
  }

  async tick() {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        status: 'pending',
        nextRetryAt: { lte: new Date() },
      },
      include: {
        subscription: true,
        event: true,
      },
    });

    // allSettled so one failure doesn't block the rest
    await Promise.allSettled(deliveries.map((delivery) => this.deliverOne(delivery)));
  }

  async deliverOne(delivery: any) {
    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: 'in_flight', attempts: delivery.attempts + 1 },
    });

    const body = delivery.event.payload;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // HMAC-SHA256 payload signing (industry standard: GitHub, Stripe, Shopify)
    if (delivery.subscription.secret) {
      const signature = crypto
        .createHmac('sha256', delivery.subscription.secret)
        .update(body)
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const startTime = Date.now();
    let statusCode: number | null = null;
    let error: string | null = null;

    try {
      const response = await axios.post(delivery.subscription.targetUrl, body, {
        headers,
        timeout: 30_000,
      });
      statusCode = response.status;
    } catch (err: any) {
      if (err.response) {
        statusCode = err.response.status;
      } else {
        error = err.message || 'Network error';
      }
    }

    const durationMs = Date.now() - startTime;
    const currentAttempt = delivery.attempts + 1;

    await this.prisma.attemptLog.create({
      data: {
        deliveryId: delivery.id,
        attemptNum: currentAttempt,
        statusCode,
        error,
        durationMs,
      },
    });

    const isSuccess = statusCode !== null && statusCode >= 200 && statusCode < 300;
    const isTemporary =
      statusCode === null ||  // network error
      statusCode === 408 ||   // request timeout
      statusCode === 429 ||   // rate limited
      statusCode >= 500;      // server error

    if (isSuccess) {
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'delivered',
          lastAttemptAt: new Date(),
          lastStatusCode: statusCode,
          lastError: null,
        },
      });
    } else if (isTemporary && currentAttempt < delivery.maxAttempts) {
      const backoffMs = this.calculateBackoff(currentAttempt);
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'pending',
          nextRetryAt: new Date(Date.now() + backoffMs),
          lastAttemptAt: new Date(),
          lastStatusCode: statusCode,
          lastError: error,
        },
      });
    } else {
      // Permanent 4xx or max attempts exhausted
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          lastAttemptAt: new Date(),
          lastStatusCode: statusCode,
          lastError: error || `Permanent failure: HTTP ${statusCode}`,
        },
      });
    }
  }

  /** Exponential backoff: base * 2^(attempt-1) + jitter to prevent retry storms */
  calculateBackoff(attempt: number): number {
    const exponentialDelay = this.BASE_DELAY_MS * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * this.MAX_JITTER_MS);
    return exponentialDelay + jitter;
  }
}
