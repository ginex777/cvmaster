import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/prisma.service';
import { GdprService } from './gdpr.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  masterCv: { findMany: jest.fn<() => Promise<unknown>>() },
  application: { findMany: jest.fn<() => Promise<unknown>>() },
  consent: { findMany: jest.fn<() => Promise<unknown>>() },
  aiJob: { deleteMany: jest.fn<() => Promise<unknown>>() },
};

describe('GdprService', () => {
  let service: GdprService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GdprService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(GdprService);
  });

  it('exportData returns user, masterCvs, applications', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.de' });
    mockPrisma.masterCv.findMany.mockResolvedValue([]);
    mockPrisma.application.findMany.mockResolvedValue([]);
    mockPrisma.consent.findMany.mockResolvedValue([]);

    const result = await service.exportData('u1');

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('masterCvs');
    expect(result).toHaveProperty('applications');
  });

  it('deleteAccount calls prisma.user.delete', async () => {
    mockPrisma.user.delete.mockResolvedValue({});

    await service.deleteAccount('u1');

    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
