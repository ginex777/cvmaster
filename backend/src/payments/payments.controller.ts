import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';

interface PaddleWebhookPayload {
  event_type: string;
  data: { customer_id: string };
}

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Paddle sends all lifecycle events here */
  @Post('webhook')
  async webhook(
    @Headers('paddle-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: PaddleWebhookPayload,
  ) {
    await this.payments.handleWebhook(signature, req.rawBody!, body);
    return { ok: true };
  }
}
