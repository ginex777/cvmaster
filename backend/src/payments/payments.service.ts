import { Injectable, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../common/prisma.service';

interface PaddleWebhookData {
  customer_id: string;
}

interface PaddleWebhookPayload {
  event_type: string;
  data: PaddleWebhookData;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(signature: string, rawBody: Buffer, payload: PaddleWebhookPayload) {
    this.verifySignature(signature, rawBody);

    const { event_type, data } = payload;
    switch (event_type) {
      case 'transaction.completed':
        await this.onTransactionCompleted(data);
        break;
      case 'subscription.activated':
        await this.onSubscriptionActivated(data);
        break;
      case 'subscription.canceled':
        await this.onSubscriptionCanceled(data);
        break;
      default:
        break;
    }
  }

  private verifySignature(header: string, body: Buffer) {
    // Paddle HMAC-SHA256 verification
    const secret = process.env.PADDLE_WEBHOOK_SECRET!;
    const ts = header.split(';')[0].replace('ts=', '');
    const expected = createHmac('sha256', secret).update(`${ts}:${body.toString()}`).digest('hex');
    const received = header.split(';')[1]?.replace('h1=', '');
    if (expected !== received) throw new BadRequestException('Invalid webhook signature');
  }

  private async onTransactionCompleted(data: PaddleWebhookData) {
    await this.prisma.user.updateMany({
      where: { paddleCustomerId: data.customer_id },
      data: { plan: 'PAY_PER_APP' },
    });
    // TODO: create charge record, check match score for money-back guarantee
  }

  private async onSubscriptionActivated(data: PaddleWebhookData) {
    await this.prisma.user.updateMany({
      where: { paddleCustomerId: data.customer_id },
      data: { plan: 'PRO' },
    });
  }

  private async onSubscriptionCanceled(data: PaddleWebhookData) {
    await this.prisma.user.updateMany({
      where: { paddleCustomerId: data.customer_id },
      data: { plan: 'FREE' },
    });
  }
}
