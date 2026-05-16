import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../common/prisma.service';

interface PaddleWebhookPayload {
  event_id?: string;
  event_type?: string;
  data?: {
    id?: string;
    customer_id?: string;
    items?: Array<{
      price?: {
        id?: string;
      };
    }>;
    custom_data?: {
      userId?: string;
    };
  };
}

const SIGNATURE_TOLERANCE_SECONDS = 5;

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.isValidSignature(rawBody, signature)) {
      throw new UnauthorizedException('Ungültige Webhook-Signatur');
    }

    const event = JSON.parse(rawBody.toString()) as PaddleWebhookPayload;
    const eventId = event.event_id ?? event.data?.id;
    if (eventId && await this.hasProcessedEvent(eventId)) return;

    const userId = event.data?.custom_data?.userId;
    if (!userId) {
      await this.recordProcessedEvent(eventId, event, null);
      return;
    }

    if (event.event_type === 'subscription.activated') {
      await this.updateUserPlan(userId, 'PRO', event.data?.customer_id);
    }

    if (event.event_type === 'transaction.completed') {
      const plan = this.planForTransaction(event);
      if (plan) {
        await this.updateUserPlan(userId, plan, event.data?.customer_id);
      }
    }

    if (event.event_type === 'subscription.cancelled' || event.event_type === 'subscription.canceled') {
      await this.updateUserPlan(userId, 'FREE', event.data?.customer_id);
    }

    await this.recordProcessedEvent(eventId, event, userId);
  }

  isValidSignature(rawBody: Buffer, signature: string, now = Date.now()): boolean {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const parsed = this.parseSignatureHeader(signature);
    if (!parsed) return false;

    const timestampSeconds = Number.parseInt(parsed.timestamp, 10);
    if (!Number.isFinite(timestampSeconds)) return false;

    const ageSeconds = Math.abs(Math.floor(now / 1000) - timestampSeconds);
    if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) return false;

    const signedPayload = Buffer.concat([
      Buffer.from(`${parsed.timestamp}:`, 'utf8'),
      rawBody,
    ]);
    const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    return parsed.signatures.some((received) => {
      const receivedBuffer = Buffer.from(received);
      return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
    });
  }

  private parseSignatureHeader(signature: string): { timestamp: string; signatures: string[] } | null {
    const entries = signature
      .split(';')
      .map(part => part.trim().split('='))
      .filter((part): part is [string, string] => part.length === 2 && part[0].length > 0 && part[1].length > 0);

    const timestamp = entries.find(([key]) => key === 'ts')?.[1];
    const signatures = entries
      .filter(([key]) => key === 'h1')
      .map(([, value]) => value);

    return timestamp && signatures.length > 0 ? { timestamp, signatures } : null;
  }

  private planForTransaction(event: PaddleWebhookPayload): 'PAY_PER_APP' | 'PRO' | null {
    const priceIds = new Set(
      event.data?.items
        ?.map(item => item.price?.id)
        .filter((priceId): priceId is string => typeof priceId === 'string') ?? [],
    );

    if (this.matchesPrice(priceIds, process.env.PADDLE_PRICE_PAY_PER_APP)) return 'PAY_PER_APP';
    if (this.matchesPrice(priceIds, process.env.PADDLE_PRICE_PRO_MONTHLY)) return 'PRO';
    if (this.matchesPrice(priceIds, process.env.PADDLE_PRICE_PRO_YEARLY)) return 'PRO';
    return null;
  }

  private matchesPrice(priceIds: Set<string>, configuredPriceId: string | undefined): boolean {
    return !!configuredPriceId && priceIds.has(configuredPriceId);
  }

  private async updateUserPlan(userId: string, plan: 'FREE' | 'PAY_PER_APP' | 'PRO', paddleCustomerId?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        ...(paddleCustomerId ? { paddleCustomerId } : {}),
      },
    });
  }

  private async hasProcessedEvent(eventId: string): Promise<boolean> {
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        event: 'paddle.webhook.processed',
        payload: { path: ['eventId'], equals: eventId },
      },
    });
    return !!existing;
  }

  private async recordProcessedEvent(eventId: string | undefined, event: PaddleWebhookPayload, userId: string | null): Promise<void> {
    if (!eventId) return;

    await this.prisma.auditLog.create({
      data: {
        userId,
        event: 'paddle.webhook.processed',
        payload: {
          eventId,
          eventType: event.event_type ?? 'unknown',
          paddleObjectId: event.data?.id ?? null,
        },
      },
    });
  }
}
