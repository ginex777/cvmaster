import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { z } from 'zod';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

const ALLOWED_MAGIC: Record<string, Buffer> = {
  pdf:  Buffer.from([0x25, 0x50, 0x44, 0x46]),         // %PDF
  docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]),          // PK..
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 30;
const MAX_DOCX_ENTRIES = 256;
const MAX_DOCX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
const MAX_DOCX_COMPRESSION_RATIO = 100;
const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP64_SENTINEL = 0xffff;
const ZIP64_SIZE_SENTINEL = 0xffffffff;

type UploadKind = 'pdf' | 'docx';

const updateCvSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(8).optional(),
  template: z.enum(['classic', 'modern', 'editorial']).optional(),
});

const quickstartSchema = z.object({
  name: z.string().trim().min(2).max(120),
  currentRoleOrStudy: z.string().trim().min(3).max(160),
  topSkills: z.array(z.string().trim().min(1).max(60)).min(3).max(5),
  language: z.enum(['de', 'en']),
  targetRole: z.string().trim().min(3).max(120),
});

@Injectable()
export class CvsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async parseAndStore(file: Express.Multer.File, name: string, userId: string) {
    const kind = this.validateUpload(file.buffer);
    const sourceHash = createHash('sha256').update(file.buffer).digest('hex');

    const existing = await this.prisma.masterCv.findFirst({ where: { userId, sourceHash } });
    if (existing) return existing;

    const text = await this.extractText(file, kind);
    const parsedJson = await this.ai.parseCv(text, { userId });

    const cv = await this.prisma.masterCv.create({
      data: { userId, name: name || file.originalname, language: 'de', parsedJson, sourceFilename: file.originalname, sourceHash },
    });

    return cv;
  }

  async listForUser(userId: string) {
    return this.prisma.masterCv.findMany({
      where: { userId },
      select: { id: true, name: true, language: true, sourceFilename: true, template: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createQuickstart(data: unknown, userId: string) {
    const parsed = quickstartSchema.safeParse(data);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const sourceHash = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
    const existing = await this.prisma.masterCv.findFirst({ where: { userId, sourceHash } });
    if (existing) return existing;

    const parsedJson = await this.ai.generateQuickstartCv(parsed.data, { userId });
    return this.prisma.masterCv.create({
      data: {
        userId,
        name: `${parsed.data.name} - Quickstart`,
        language: parsed.data.language,
        parsedJson,
        sourceFilename: 'quickstart',
        sourceHash,
      },
    });
  }

  async update(id: string, userId: string, data: unknown) {
    const parsed = updateCvSchema.safeParse(data);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const cv = await this.prisma.masterCv.findFirst({ where: { id, userId } });
    if (!cv) throw new NotFoundException('CV nicht gefunden');

    return this.prisma.masterCv.update({ where: { id }, data: parsed.data });
  }

  async remove(id: string, userId: string) {
    const cv = await this.prisma.masterCv.findFirst({ where: { id, userId } });
    if (!cv) throw new NotFoundException('CV nicht gefunden');
    await this.prisma.masterCv.delete({ where: { id } });
  }

  private validateUpload(buf: Buffer): UploadKind {
    if (buf.length === 0 || buf.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File size is not supported');
    }

    const isPdf = buf.slice(0, 4).equals(ALLOWED_MAGIC.pdf);
    if (isPdf) {
      return 'pdf';
    }

    const isDocx = buf.slice(0, 4).equals(ALLOWED_MAGIC.docx);
    if (!isDocx) {
      throw new BadRequestException('Unsupported file type');
    }

    this.validateDocxStructure(buf);
    return 'docx';
  }

  private validateDocxStructure(buf: Buffer) {
    const centralDirectory = this.findCentralDirectory(buf);
    if (centralDirectory.entryCount < 1 || centralDirectory.entryCount > MAX_DOCX_ENTRIES) {
      throw new BadRequestException('DOCX structure is not supported');
    }

    let offset = centralDirectory.offset;
    let totalUncompressedBytes = 0;
    const names = new Set<string>();

    for (let index = 0; index < centralDirectory.entryCount; index += 1) {
      if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
        throw new BadRequestException('DOCX structure is invalid');
      }

      const compressedSize = buf.readUInt32LE(offset + 20);
      const uncompressedSize = buf.readUInt32LE(offset + 24);
      const nameLength = buf.readUInt16LE(offset + 28);
      const extraLength = buf.readUInt16LE(offset + 30);
      const commentLength = buf.readUInt16LE(offset + 32);
      const nameStart = offset + 46;
      const nameEnd = nameStart + nameLength;
      const nextOffset = nameEnd + extraLength + commentLength;

      if (nextOffset > buf.length || compressedSize === ZIP64_SIZE_SENTINEL || uncompressedSize === ZIP64_SIZE_SENTINEL) {
        throw new BadRequestException('DOCX structure is not supported');
      }

      const entryName = buf.toString('utf8', nameStart, nameEnd);
      if (entryName.includes('..') || entryName.startsWith('/') || entryName.startsWith('\\')) {
        throw new BadRequestException('DOCX structure is invalid');
      }

      if (uncompressedSize > 0 && compressedSize === 0) {
        throw new BadRequestException('DOCX compression is invalid');
      }

      if (compressedSize > 0 && uncompressedSize / compressedSize > MAX_DOCX_COMPRESSION_RATIO) {
        throw new BadRequestException('DOCX compression ratio is too high');
      }

      totalUncompressedBytes += uncompressedSize;
      if (totalUncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES) {
        throw new BadRequestException('DOCX expanded size is too large');
      }

      names.add(entryName);
      offset = nextOffset;
    }

    if (!names.has('[Content_Types].xml') || !names.has('word/document.xml')) {
      throw new BadRequestException('DOCX structure is invalid');
    }
  }

  private findCentralDirectory(buf: Buffer): { entryCount: number; offset: number } {
    const minOffset = Math.max(0, buf.length - 65_557);
    for (let offset = buf.length - 22; offset >= minOffset; offset -= 1) {
      if (buf.readUInt32LE(offset) !== ZIP_EOCD_SIGNATURE) {
        continue;
      }

      const entryCount = buf.readUInt16LE(offset + 10);
      const directorySize = buf.readUInt32LE(offset + 12);
      const directoryOffset = buf.readUInt32LE(offset + 16);

      if (entryCount === ZIP64_SENTINEL || directoryOffset === ZIP64_SIZE_SENTINEL || directorySize === ZIP64_SIZE_SENTINEL) {
        throw new BadRequestException('DOCX structure is not supported');
      }

      if (directoryOffset + directorySize > buf.length) {
        throw new BadRequestException('DOCX structure is invalid');
      }

      return { entryCount, offset: directoryOffset };
    }

    throw new BadRequestException('DOCX structure is invalid');
  }

  private async extractText(file: Express.Multer.File, kind: UploadKind): Promise<string> {
    if (kind === 'pdf') {
      const result = await this.parsePdf(file.buffer);
      return result.text.slice(0, 50_000);
    }

    const result = await this.parseDocx(file.buffer);
    return result.value.slice(0, 50_000);
  }

  private async parsePdf(buffer: Buffer) {
    try {
      const result = await pdfParse(buffer, { max: MAX_PDF_PAGES + 1 });
      if (result.numpages > MAX_PDF_PAGES) {
        throw new BadRequestException(`PDF page limit exceeded (${MAX_PDF_PAGES})`);
      }

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('PDF could not be parsed');
    }
  }

  private async parseDocx(buffer: Buffer) {
    try {
      return await mammoth.extractRawText({ buffer });
    } catch {
      throw new BadRequestException('DOCX could not be parsed');
    }
  }
}
