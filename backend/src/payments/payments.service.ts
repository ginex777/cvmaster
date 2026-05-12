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

const SIGNATURE_TOLERANCE_SECONDS = 5;

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
}
