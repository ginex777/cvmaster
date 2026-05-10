import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

jest.mock('pdf-parse', () => jest.fn<() => Promise<{ text: string }>>().mockResolvedValue({ text: 'extracted pdf text' }));
jest.mock('mammoth', () => ({ extractRawText: jest.fn<() => Promise<{ value: string }>>().mockResolvedValue({ value: 'extracted docx text' }) }));

import { CvsService } from './cvs.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  masterCv: { findFirst: fn(), findMany: fn(), create: fn(), delete: fn(), update: fn() },
};

const mockAi = { parseCv: fn() };

describe('CvsService', () => {
  let service: CvsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CvsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();
    service = module.get(CvsService);
  });

  describe('parseAndStore', () => {
    it('throws BadRequestException for non-PDF/DOCX magic bytes', async () => {
      const file = { buffer: Buffer.from('not a valid file'), originalname: 'test.txt' } as Express.Multer.File;
      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('calls AiService.parseCv with extracted text for PDF', async () => {
      const buf = Buffer.alloc(10);
      buf.write('%PDF-', 0, 'ascii');
      const file = { buffer: buf, originalname: 'cv.pdf' } as Express.Multer.File;
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockAi.parseCv.mockResolvedValue({ name: 'Lina', skills: ['React'] });
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv1', name: 'cv' });

      await service.parseAndStore(file, '', 'u1');

      expect(mockAi.parseCv).toHaveBeenCalled();
    });

    it('returns existing CV when same hash already stored', async () => {
      const buf = Buffer.alloc(10);
      buf.write('%PDF-', 0, 'ascii');
      const file = { buffer: buf, originalname: 'cv.pdf' } as Express.Multer.File;
      const existing = { id: 'cv-existing', name: 'existing' };
      mockPrisma.masterCv.findFirst.mockResolvedValue(existing);

      const result = await service.parseAndStore(file, '', 'u1');

      expect(result).toBe(existing);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
    });

    it('returns created MasterCv on success', async () => {
      const buf = Buffer.alloc(10);
      buf.write('%PDF-', 0, 'ascii');
      const file = { buffer: buf, originalname: 'cv.pdf' } as Express.Multer.File;
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockAi.parseCv.mockResolvedValue({});
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv1', name: 'cv' });

      const result = await service.parseAndStore(file, 'My CV', 'u1') as { id: string };

      expect(result).toHaveProperty('id', 'cv1');
    });

    it('throws BadRequestException for DOCX-like buffer that is not DOCX magic', async () => {
      const file = { buffer: Buffer.from([0x50, 0x4b, 0x99, 0x99]), originalname: 'bad.zip' } as Express.Multer.File;
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockAi.parseCv.mockResolvedValue({});
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv2' });

      // PK\x99\x99 differs from PK\x03\x04 so it should throw
      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listForUser', () => {
    it('returns only CVs belonging to userId', async () => {
      const cvs = [{ id: 'cv1', userId: 'u1' }];
      mockPrisma.masterCv.findMany.mockResolvedValue(cvs);

      const result = await service.listForUser('u1');

      expect(mockPrisma.masterCv.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
      expect(result).toBe(cvs);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when CV does not exist or not owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);

      await expect(service.remove('cv1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('deletes the CV when found and owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1', userId: 'u1' });
      mockPrisma.masterCv.delete.mockResolvedValue({});

      await service.remove('cv1', 'u1');

      expect(mockPrisma.masterCv.delete).toHaveBeenCalledWith({ where: { id: 'cv1' } });
    });
  });

  describe('update', () => {
    it('persists a valid template for an owned CV', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1', userId: 'u1' });
      mockPrisma.masterCv.update.mockResolvedValue({ id: 'cv1', template: 'editorial' });

      await expect(service.update('cv1', 'u1', { template: 'editorial' })).resolves.toEqual({
        id: 'cv1',
        template: 'editorial',
      });
      expect(mockPrisma.masterCv.update).toHaveBeenCalledWith({
        where: { id: 'cv1' },
        data: { template: 'editorial' },
      });
    });

    it('throws BadRequestException for an invalid template', async () => {
      await expect(service.update('cv1', 'u1', { template: 'loud' })).rejects.toThrow(BadRequestException);
      expect(mockPrisma.masterCv.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when updating a CV not owned by the user', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);

      await expect(service.update('cv1', 'u1', { name: 'New CV' })).rejects.toThrow(NotFoundException);
    });
  });
});
