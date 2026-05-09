import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import type { ParsedCV, ParsedJob } from '../ai/provider';

function redisUrl(): string {
  const value = process.env.REDIS_URL;
  if (!value) {
    throw new Error('REDIS_URL is required');
  }

  return value;
}

@Injectable()
export class AiPipelineProcessor implements OnModuleInit {
  private redis: IORedis;

  constructor(private prisma: PrismaService, private ai: AiService) {}

  onModuleInit() {
    this.redis = new IORedis(redisUrl(), { maxRetriesPerRequest: null });
    new Worker('ai-pipeline', (job) => this.process(job), { connection: this.redis });
  }

  private async process(job: Job) {
    const { applicationId } = job.data;

    const app = await this.prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { masterCv: true, jobPosting: true },
    });

    await job.updateProgress(10);

    // Step 1: Optimize CV
    const optimizedCv = await this.ai.optimizeCv(
      app.masterCv.parsedJson as unknown as ParsedCV,
      app.jobPosting.parsedJson as unknown as ParsedJob,
    );
    await job.updateProgress(50);

    // Step 2: Generate cover letter (3 variants)
    const coverLetter = await this.ai.generateCoverLetter(
      optimizedCv,
      app.jobPosting.parsedJson as unknown as ParsedJob,
    );
    await job.updateProgress(85);

    // Step 3: Compute match score (deterministic, no LLM)
    const matchScore = this.computeMatchScore(optimizedCv, app.jobPosting.parsedJson as unknown as ParsedJob);

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { optimizedCv, coverLetter, matchScore, status: 'DRAFT' },
    });

    await job.updateProgress(100);
  }

  private computeMatchScore(cv: ParsedCV, job: ParsedJob): number {
    const cvSkills  = new Set<string>((cv.skills ?? []).map((s: string) => s.toLowerCase()));
    const jobSkills = (job.skills ?? []) as string[];
    const matched   = jobSkills.filter(s => cvSkills.has(s.toLowerCase())).length;
    return jobSkills.length ? Math.round((matched / jobSkills.length) * 100) : 0;
  }
}
