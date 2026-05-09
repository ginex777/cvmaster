import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async parse(data: { type: string; value: string }, userId: string) {
    const text = await this.fetchText(data);
    const sourceHash = createHash('sha256').update(text).digest('hex');

    const existing = await this.prisma.jobPosting.findUnique({ where: { sourceHash } });
    if (existing) return existing;

    const parsedJson = await this.ai.parseJob(text);

    return this.prisma.jobPosting.create({
      data: { userId, sourceType: data.type, sourceValue: data.value.slice(0, 2000), sourceHash, parsedJson },
    });
  }

  private async fetchText(data: { type: string; value: string }): Promise<string> {
    switch (data.type) {
      case 'text':
        return data.value;
      case 'url':
        // TODO: Playwright headless crawl + Readability.js
        throw new Error('URL crawling not yet implemented');
      case 'screenshot':
        // TODO: multimodal LLM call for image
        throw new Error('Screenshot parsing not yet implemented');
      case 'pdf':
        // TODO: pdf-parse from base64
        throw new Error('PDF parsing not yet implemented');
      default:
        throw new Error('Unknown source type');
    }
  }
}
