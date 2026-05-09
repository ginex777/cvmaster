import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Paddle sends all lifecycle events here */
  @Post('webhook')
  async webhook(
    @Headers('paddle-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: unknown,
  ) {
    await this.payments.handleWebhook(signature, req.rawBody!, body as any);
    return { ok: true };
  }
}
