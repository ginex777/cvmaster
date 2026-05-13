import { Injectable, NotImplementedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async parse(data: { type: string; value: string }, userId: string) {
    const text = await this.fetchText(data);
    const sourceHash = createHash('sha256').update(text).digest('hex');

    const existing = await this.prisma.jobPosting.findFirst({ where: { userId, sourceHash } });
    if (existing) return existing;

    const parsedJson = await this.ai.parseJob(text, { userId });

    return this.prisma.jobPosting.create({
      data: { userId, sourceType: data.type, sourceValue: data.value.slice(0, 2000), sourceHash, parsedJson },
    });
  }

  private async fetchText(data: { type: string; value: string }): Promise<string> {
    switch (data.type) {
      case 'text':
        return data.value;
      case 'url':
        throw new NotImplementedException('URL crawling is not yet supported');
      case 'screenshot':
        throw new NotImplementedException('Screenshot parsing is not yet supported');
      case 'pdf':
        throw new NotImplementedException('PDF job ad parsing is not yet supported');
      default:
        throw new NotImplementedException('Unknown job input type');
    }
  }
}
