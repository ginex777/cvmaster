import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

jest.mock('pdf-parse', () => jest.fn<() => Promise<{ text: string; numpages: number }>>().mockResolvedValue({ text: 'extracted pdf text', numpages: 1 }));
jest.mock('mammoth', () => ({ extractRawText: jest.fn<() => Promise<{ value: string }>>().mockResolvedValue({ value: 'extracted docx text' }) }));

import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { CvsService } from './cvs.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  masterCv: { findFirst: fn(), findMany: fn(), create: fn(), delete: fn(), update: fn() },
};

const mockAi = { parseCv: fn(), generateQuickstartCv: fn() };
const pdfParseMock = jest.mocked(pdfParse);
const mammothMock = jest.mocked(mammoth.extractRawText);

interface ZipEntrySpec {
  name: string;
  compressedSize?: number;
  uncompressedSize?: number;
}

function createDocxBuffer(entries: ZipEntrySpec[] = [
  { name: '[Content_Types].xml', compressedSize: 12, uncompressedSize: 12 },
  { name: 'word/document.xml', compressedSize: 16, uncompressedSize: 16 },
]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const compressedSize = entry.compressedSize ?? 4;
    const uncompressedSize = entry.uncompressedSize ?? compressedSize;
    const local = Buffer.alloc(30 + name.length + compressedSize);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    localParts.push(local);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(localOffset, 42);
    name.copy(central, 46);
    centralParts.push(central);

    localOffset += local.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(localOffset, 16);

  return Buffer.concat([...localParts, centralDirectory, eocd]);
}

describe('CvsService', () => {
  let service: CvsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    pdfParseMock.mockResolvedValue({ text: 'extracted pdf text', numpages: 1 } as Awaited<ReturnType<typeof pdfParse>>);
    mammothMock.mockResolvedValue({ value: 'extracted docx text', messages: [] });
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

    it('throws BadRequestException for oversized input before parsing', async () => {
      const buf = Buffer.alloc(10 * 1024 * 1024 + 1);
      buf.write('%PDF-', 0, 'ascii');
      const file = { buffer: buf, originalname: 'large.pdf' } as Express.Multer.File;

      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
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

    it('throws BadRequestException when PDF parsing fails', async () => {
      const buf = Buffer.alloc(10);
      buf.write('%PDF-', 0, 'ascii');
      const file = { buffer: buf, originalname: 'bad.pdf' } as Express.Multer.File;
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      pdfParseMock.mockRejectedValueOnce(new Error('malformed pdf'));

      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when PDF page limit is exceeded', async () => {
      const buf = Buffer.alloc(10);
      buf.write('%PDF-', 0, 'ascii');
      const file = { buffer: buf, originalname: 'long.pdf' } as Express.Multer.File;
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      pdfParseMock.mockResolvedValueOnce({ text: 'too long', numpages: 31 } as Awaited<ReturnType<typeof pdfParse>>);

      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
    });

    it('calls AiService.parseCv with extracted text for valid DOCX structure', async () => {
      const file = { buffer: createDocxBuffer(), originalname: 'cv.docx' } as Express.Multer.File;
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockAi.parseCv.mockResolvedValue({ name: 'Lina', skills: ['Angular'] });
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv-docx', name: 'cv' });

      await service.parseAndStore(file, '', 'u1');

      expect(mammothMock).toHaveBeenCalled();
      expect(mockAi.parseCv).toHaveBeenCalledWith('extracted docx text', { userId: 'u1' });
    });

    it('throws BadRequestException for ZIP input missing DOCX entries', async () => {
      const file = { buffer: createDocxBuffer([{ name: 'plain.txt' }]), originalname: 'bad.docx' } as Express.Multer.File;

      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for suspicious DOCX compression ratio', async () => {
      const file = {
        buffer: createDocxBuffer([
          { name: '[Content_Types].xml', compressedSize: 1, uncompressedSize: 12 },
          { name: 'word/document.xml', compressedSize: 1, uncompressedSize: 512 },
        ]),
        originalname: 'bomb.docx',
      } as Express.Multer.File;

      await expect(service.parseAndStore(file, '', 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
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

  describe('createQuickstart', () => {
    const input = {
      name: 'Lina Beispiel',
      currentRoleOrStudy: 'Studentin Wirtschaftsinformatik',
      topSkills: ['Angular', 'TypeScript', 'Testing'],
      language: 'de',
      targetRole: 'Junior Frontend Developer',
    };

    it('validates quickstart input before AI generation', async () => {
      await expect(service.createQuickstart({ ...input, topSkills: ['Angular'] }, 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.generateQuickstartCv).not.toHaveBeenCalled();
    });

    it('generates and stores a quickstart CV skeleton', async () => {
      const parsedCv = { name: 'Lina Beispiel', experience: [], education: [], skills: input.topSkills, languages: [] };
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockAi.generateQuickstartCv.mockResolvedValue(parsedCv);
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv-quickstart', parsedJson: parsedCv });

      const result = await service.createQuickstart(input, 'u1') as { id: string };

      expect(result.id).toBe('cv-quickstart');
      expect(mockAi.generateQuickstartCv).toHaveBeenCalledWith(input, { userId: 'u1' });
      expect(mockPrisma.masterCv.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          name: 'Lina Beispiel - Quickstart',
          language: 'de',
          parsedJson: parsedCv,
          sourceFilename: 'quickstart',
        }),
      });
    });

    it('returns an existing quickstart CV when the input hash already exists', async () => {
      const existing = { id: 'cv-existing' };
      mockPrisma.masterCv.findFirst.mockResolvedValue(existing);

      const result = await service.createQuickstart(input, 'u1');

      expect(result).toBe(existing);
      expect(mockAi.generateQuickstartCv).not.toHaveBeenCalled();
      expect(mockPrisma.masterCv.create).not.toHaveBeenCalled();
    });
  });

  describe('createFromText', () => {
    const input = {
      name: 'Lina Text CV',
      language: 'de',
      text: 'Lina Beispiel arbeitet mit Angular, TypeScript, Testing und barrierearmen Web-Oberflaechen.',
    };

    it('validates pasted CV text before AI parsing', async () => {
      await expect(service.createFromText({ ...input, text: 'zu kurz' }, 'u1')).rejects.toThrow(BadRequestException);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
    });

    it('parses and stores a pasted text CV', async () => {
      const parsedCv = { name: 'Lina Beispiel', experience: [], education: [], skills: ['Angular'], languages: [] };
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockAi.parseCv.mockResolvedValue(parsedCv);
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv-text', parsedJson: parsedCv });

      const result = await service.createFromText(input, 'u1') as { id: string };

      expect(result.id).toBe('cv-text');
      expect(mockAi.parseCv).toHaveBeenCalledWith(input.text, { userId: 'u1' });
      expect(mockPrisma.masterCv.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          name: 'Lina Text CV',
          language: 'de',
          parsedJson: parsedCv,
          sourceFilename: 'text-input',
        }),
      });
    });

    it('returns an existing text CV when the same pasted content already exists', async () => {
      const existing = { id: 'cv-existing' };
      mockPrisma.masterCv.findFirst.mockResolvedValue(existing);

      const result = await service.createFromText(input, 'u1');

      expect(result).toBe(existing);
      expect(mockAi.parseCv).not.toHaveBeenCalled();
      expect(mockPrisma.masterCv.create).not.toHaveBeenCalled();
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
      mockPrisma.masterCv.update.mockResolvedValue({ id: 'cv1', template: 'executive' });

      await expect(service.update('cv1', 'u1', { template: 'executive' })).resolves.toEqual({
        id: 'cv1',
        template: 'executive',
      });
      expect(mockPrisma.masterCv.update).toHaveBeenCalledWith({
        where: { id: 'cv1' },
        data: { template: 'executive' },
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
