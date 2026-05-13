import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/prisma.service';
import { GdprService } from './gdpr.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  session: { updateMany: jest.fn<() => Promise<unknown>>() },
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

  it('deleteAccount soft-deletes the user and revokes active sessions', async () => {
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.session.updateMany.mockResolvedValue({});

    await service.deleteAccount('u1');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
