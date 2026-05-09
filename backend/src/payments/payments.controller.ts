import { Controller, Post, Headers, RawBodyRequest, Req } from '@nestjs/common';
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
  ) {
    await this.payments.handleWebhook(req.rawBody ?? Buffer.from('{}'), signature);
    return { ok: true };
  }
}
