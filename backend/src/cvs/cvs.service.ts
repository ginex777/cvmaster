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

const updateCvSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(8).optional(),
  template: z.enum(['classic', 'modern', 'editorial']).optional(),
});

@Injectable()
export class CvsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async parseAndStore(file: Express.Multer.File, name: string, userId: string) {
    this.validateMagicBytes(file.buffer);
    const sourceHash = createHash('sha256').update(file.buffer).digest('hex');

    const existing = await this.prisma.masterCv.findFirst({ where: { userId, sourceHash } });
    if (existing) return existing;

    const text = await this.extractText(file);
    const parsedJson = await this.ai.parseCv(text);

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

  private validateMagicBytes(buf: Buffer) {
    const isPdf  = buf.slice(0, 4).equals(ALLOWED_MAGIC.pdf);
    const isDocx = buf.slice(0, 4).equals(ALLOWED_MAGIC.docx);
    if (!isPdf && !isDocx) throw new BadRequestException('Unsupported file type');
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const isPdf = file.buffer.slice(0, 4).equals(ALLOWED_MAGIC.pdf);
    if (isPdf) {
      const result = await pdfParse(file.buffer);
      return result.text.slice(0, 50_000);
    }
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.slice(0, 50_000);
  }
}
