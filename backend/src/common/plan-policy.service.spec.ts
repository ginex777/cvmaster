import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlanPolicyService } from './plan-policy.service';
import { PrismaService } from './prisma.service';

const mockPrisma = {
  application: {
    count: jest.fn<() => Promise<number>>(),
  },
};

describe('PlanPolicyService', () => {
  let service: PlanPolicyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PlanPolicyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(PlanPolicyService);
  });

  it('allows FREE users before the one-application limit', async () => {
    mockPrisma.application.count.mockResolvedValue(0);

    await expect(service.assertCanCreateApplication('u1', 'FREE')).resolves.toBeUndefined();
  });

  it('blocks FREE users at the one-application limit', async () => {
    mockPrisma.application.count.mockResolvedValue(1);

    await expect(service.assertCanCreateApplication('u1', 'FREE')).rejects.toThrow(HttpException);
  });

  it('allows PAY_PER_APP users for exactly one paid application beyond the free slot', async () => {
    mockPrisma.application.count.mockResolvedValue(1);

    await expect(service.assertCanCreateApplication('u1', 'PAY_PER_APP')).resolves.toBeUndefined();
  });

  it('blocks PAY_PER_APP users after the paid application is used', async () => {
    mockPrisma.application.count.mockResolvedValue(2);

    await expect(service.assertCanCreateApplication('u1', 'PAY_PER_APP')).rejects.toThrow(HttpException);
  });

  it('does not count applications for PRO users', async () => {
    await expect(service.assertCanCreateApplication('u1', 'PRO')).resolves.toBeUndefined();

    expect(mockPrisma.application.count).not.toHaveBeenCalled();
  });
});
