import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/prisma.service';
import { PaymentsService } from './payments.service';

const mockPrisma = {
  user: { update: jest.fn<() => Promise<unknown>>() },
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  it('throws UnauthorizedException on invalid webhook signature', async () => {
    jest.spyOn(service, 'isValidSignature').mockReturnValue(false);

    await expect(service.handleWebhook(Buffer.from('{}'), 'bad-sig')).rejects.toThrow(UnauthorizedException);
  });

  it('upgrades user to PRO on subscription.activated', async () => {
    jest.spyOn(service, 'isValidSignature').mockReturnValue(true);
    mockPrisma.user.update.mockResolvedValue({});
    const event = JSON.stringify({
      event_type: 'subscription.activated',
      data: { custom_data: { userId: 'u1' } },
    });

    await service.handleWebhook(Buffer.from(event), 'valid');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan: 'PRO' },
    });
  });

  it('downgrades user to FREE on subscription.cancelled', async () => {
    jest.spyOn(service, 'isValidSignature').mockReturnValue(true);
    mockPrisma.user.update.mockResolvedValue({});
    const event = JSON.stringify({
      event_type: 'subscription.cancelled',
      data: { custom_data: { userId: 'u1' } },
    });

    await service.handleWebhook(Buffer.from(event), 'valid');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { plan: 'FREE' },
    });
  });
});
