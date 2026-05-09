import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../common/prisma.service';

interface PaddleWebhookPayload {
  event_type?: string;
  data?: {
    custom_data?: {
      userId?: string;
    };
  };
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.isValidSignature(rawBody, signature)) {
      throw new UnauthorizedException('UngÃ¼ltige Webhook-Signatur');
    }

    const event = JSON.parse(rawBody.toString()) as PaddleWebhookPayload;
    const userId = event.data?.custom_data?.userId;
    if (!userId) return;

    if (event.event_type === 'subscription.activated') {
      await this.prisma.user.update({ where: { id: userId }, data: { plan: 'PRO' } });
    }

    if (event.event_type === 'subscription.cancelled' || event.event_type === 'subscription.canceled') {
      await this.prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
    }
  }

  isValidSignature(rawBody: Buffer, signature: string): boolean {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}
