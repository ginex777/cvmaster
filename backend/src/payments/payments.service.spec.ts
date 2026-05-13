import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { PaymentsService } from './payments.service';

const mockPrisma = {
  user: { update: jest.fn<() => Promise<unknown>>() },
  auditLog: {
    findFirst: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
  },
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  const originalEnv = process.env.PADDLE_WEBHOOK_SECRET;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.PADDLE_WEBHOOK_SECRET = 'paddle-secret';
    process.env.PADDLE_PRICE_PAY_PER_APP = 'pri_pay_per_app';
    process.env.PADDLE_PRICE_PRO_MONTHLY = 'pri_pro_monthly';
    process.env.PADDLE_PRICE_PRO_YEARLY = 'pri_pro_yearly';
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({});
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  afterEach(() => {
    process.env.PADDLE_WEBHOOK_SECRET = originalEnv;
  });

  it('throws UnauthorizedException on invalid webhook signature', async () => {
    await expect(service.handleWebhook(Buffer.from('{}'), 'bad-sig')).rejects.toThrow(UnauthorizedException);
  });

  it('upgrades user to PRO on subscription.activated', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    const event = JSON.stringify({
      event_type: 'subscription.activated',
      event_id: 'evt_sub_activated',
      data: { customer_id: 'ctm_1', custom_data: { userId: 'u1' } },
    });

    await service.handleWebhook(Buffer.from(event), signatureFor(event));

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan: 'PRO', paddleCustomerId: 'ctm_1' },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ event: 'paddle.webhook.processed' }),
    }));
  });

  it('upgrades user to PAY_PER_APP on pay-per-app transaction.completed', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    const event = JSON.stringify({
      event_type: 'transaction.completed',
      event_id: 'evt_pay',
      data: {
        customer_id: 'ctm_1',
        custom_data: { userId: 'u1' },
        items: [{ price: { id: 'pri_pay_per_app' } }],
      },
    });

    await service.handleWebhook(Buffer.from(event), signatureFor(event));

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan: 'PAY_PER_APP', paddleCustomerId: 'ctm_1' },
    });
  });

  it('upgrades user to PRO on monthly and yearly transaction.completed', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    const monthly = JSON.stringify({
      event_type: 'transaction.completed',
      event_id: 'evt_monthly',
      data: { custom_data: { userId: 'u1' }, items: [{ price: { id: 'pri_pro_monthly' } }] },
    });
    const yearly = JSON.stringify({
      event_type: 'transaction.completed',
      event_id: 'evt_yearly',
      data: { custom_data: { userId: 'u1' }, items: [{ price: { id: 'pri_pro_yearly' } }] },
    });

    await service.handleWebhook(Buffer.from(monthly), signatureFor(monthly));
    await service.handleWebhook(Buffer.from(yearly), signatureFor(yearly));

    expect(mockPrisma.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'u1' },
      data: { plan: 'PRO' },
    });
    expect(mockPrisma.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'u1' },
      data: { plan: 'PRO' },
    });
  });

  it('skips duplicate webhook events', async () => {
    mockPrisma.auditLog.findFirst.mockResolvedValue({ id: 'audit-1' });
    const event = JSON.stringify({
      event_type: 'transaction.completed',
      event_id: 'evt_pay',
      data: { custom_data: { userId: 'u1' }, items: [{ price: { id: 'pri_pay_per_app' } }] },
    });

    await service.handleWebhook(Buffer.from(event), signatureFor(event));

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('downgrades user to FREE on subscription.cancelled', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    const event = JSON.stringify({
      event_type: 'subscription.cancelled',
      event_id: 'evt_cancelled',
      data: { custom_data: { userId: 'u1' } },
    });

    await service.handleWebhook(Buffer.from(event), signatureFor(event));

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan: 'FREE' },
    });
  });

  it('accepts a valid Paddle signature header', () => {
    const body = Buffer.from('{"event_type":"subscription.activated"}');
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signatureFor(body, timestamp);

    expect(service.isValidSignature(body, signature)).toBe(true);
  });

  it('rejects a malformed Paddle signature header', () => {
    expect(service.isValidSignature(Buffer.from('{}'), 'h1=abc')).toBe(false);
    expect(service.isValidSignature(Buffer.from('{}'), 'ts=123')).toBe(false);
  });

  it('rejects an expired Paddle signature timestamp', () => {
    const body = Buffer.from('{}');
    const timestamp = Math.floor(Date.now() / 1000) - 60;

    expect(service.isValidSignature(body, signatureFor(body, timestamp))).toBe(false);
  });

  it('rejects a signature generated with the wrong secret', () => {
    const body = Buffer.from('{}');
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = createHmac('sha256', 'wrong-secret').update(`${timestamp}:${body.toString()}`).digest('hex');

    expect(service.isValidSignature(body, `ts=${timestamp};h1=${digest}`)).toBe(false);
  });
});

function signatureFor(body: string | Buffer, timestamp = Math.floor(Date.now() / 1000)): string {
  const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const digest = createHmac('sha256', 'paddle-secret')
    .update(Buffer.concat([Buffer.from(`${timestamp}:`, 'utf8'), rawBody]))
    .digest('hex');

  return `ts=${timestamp};h1=${digest}`;
}
