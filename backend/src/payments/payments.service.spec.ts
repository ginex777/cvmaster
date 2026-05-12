import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { PaymentsService } from './payments.service';

const mockPrisma = {
  user: { update: jest.fn<() => Promise<unknown>>() },
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  const originalEnv = process.env.PADDLE_WEBHOOK_SECRET;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.PADDLE_WEBHOOK_SECRET = 'paddle-secret';
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
      data: { custom_data: { userId: 'u1' } },
    });

    await service.handleWebhook(Buffer.from(event), signatureFor(event));

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan: 'PRO' },
    });
  });

  it('downgrades user to FREE on subscription.cancelled', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    const event = JSON.stringify({
      event_type: 'subscription.cancelled',
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
