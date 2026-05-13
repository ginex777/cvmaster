import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { MatchScoringService } from '../match/match-scoring.service';
import type { ParsedCV, ParsedJob } from '../ai/provider';

function redisUrl(): string {
  const value = process.env.REDIS_URL;
  if (!value) throw new Error('REDIS_URL is required');
  return value;
}

function sanitizeText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeCv(cv: ParsedCV): ParsedCV {
  return {
    ...cv,
    summary: cv.summary ? sanitizeText(cv.summary) : cv.summary,
    skills: (cv.skills ?? []).map(sanitizeText),
    experience: (cv.experience ?? []).map(e => ({
      ...e,
      role: sanitizeText(e.role),
      company: sanitizeText(e.company),
      bullets: e.bullets.map(b => ({ ...b, text: sanitizeText(b.text) })),
    })),
  };
}

function sanitizeLetter(letter: { concise: string; warm: string; formal: string }): { concise: string; warm: string; formal: string } {
  return {
    concise: sanitizeText(letter.concise),
    warm: sanitizeText(letter.warm),
    formal: sanitizeText(letter.formal),
  };
}

function filterHallucinatedSkills(optimizedCv: ParsedCV, originalCv: ParsedCV): ParsedCV {
  const originalCorpus = [
    ...(originalCv.skills ?? []),
    originalCv.summary ?? '',
    ...(originalCv.experience ?? []).flatMap(e => [e.role, e.company, ...(e.bullets ?? []).map(b => b.text)]),
    ...(originalCv.certifications ?? []),
  ].join(' ').toLowerCase();

  const filteredSkills = (optimizedCv.skills ?? []).filter(
    skill => originalCorpus.includes(skill.toLowerCase()),
  );

  return { ...optimizedCv, skills: filteredSkills };
}

@Injectable()
export class AiPipelineProcessor implements OnModuleInit {
  private readonly logger = new Logger(AiPipelineProcessor.name);
  private redis: IORedis;

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private scoring: MatchScoringService,
  ) {}

  onModuleInit() {
    this.redis = new IORedis(redisUrl(), { maxRetriesPerRequest: null });
    const worker = new Worker('ai-pipeline', (job) => this.process(job), { connection: this.redis });
    worker.on('failed', async (job, error) => {
      this.logger.error(
        `AI pipeline job failed: name=${job?.name ?? 'unknown'} id=${job?.id ?? 'unknown'} applicationId=${String(job?.data?.applicationId ?? 'unknown')}`,
        error.stack,
      );
      await this.markApplicationFailed(job);
    });
  }

  private async process(job: Job) {
    if (job.name === 'regenerate-letter') {
      return this.processRegenerateLetter(job);
    }

    return this.processFullPipeline(job);
  }

  private async processFullPipeline(job: Job) {
    const { applicationId } = job.data;

    const app = await this.prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { masterCv: true, jobPosting: true },
    });

    const originalCv = app.masterCv.parsedJson as unknown as ParsedCV;
    const parsedJob = app.jobPosting.parsedJson as unknown as ParsedJob;

    await this.updateProgress(applicationId, job, 10);

    // Step 1: Optimize CV
    const auditContext = { userId: app.userId, applicationId };

    const rawOptimizedCv = await this.ai.optimizeCv(originalCv, parsedJob, auditContext);
    const guardedCv = filterHallucinatedSkills(rawOptimizedCv, originalCv);
    const optimizedCv = sanitizeCv(guardedCv);
    await this.updateProgress(applicationId, job, 50);

    // Step 2: Generate cover letters (3 variants)
    const rawLetter = await this.ai.generateCoverLetter(optimizedCv, parsedJob, auditContext);
    const coverLetter = sanitizeLetter(rawLetter);
    await this.updateProgress(applicationId, job, 85);

    // Step 3: Compute rich match report
    const result = this.scoring.score(optimizedCv, parsedJob);
    const matchReport = {
      summary: result.summary,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      strengths: result.strengths,
      risks: result.risks,
    };

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        optimizedCv,
        coverLetter,
        matchScore: result.score,
        matchReport,
        status: 'OPEN',
        generationProgress: 100,
        generationError: null,
      },
    });

    await job.updateProgress(100);
  }

  private async processRegenerateLetter(job: Job) {
    const { applicationId } = job.data;

    const app = await this.prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { jobPosting: true },
    });

    const optimizedCv = app.optimizedCv as unknown as ParsedCV;
    const parsedJob = app.jobPosting.parsedJson as unknown as ParsedJob;

    await this.updateProgress(applicationId, job, 20);

    const rawLetter = await this.ai.generateCoverLetter(optimizedCv, parsedJob, {
      userId: app.userId,
      applicationId,
    });
    const coverLetter = sanitizeLetter(rawLetter);

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { coverLetter, generationProgress: 100, generationError: null },
    });

    await job.updateProgress(100);
  }

  private async updateProgress(applicationId: string, job: Job, progress: number): Promise<void> {
    await Promise.all([
      job.updateProgress(progress),
      this.prisma.application.update({
        where: { id: applicationId },
        data: { generationProgress: progress, generationError: null },
      }),
    ]);
  }

  private async markApplicationFailed(job: Job | undefined): Promise<void> {
    if (!job) return;
    const applicationId = typeof job?.data?.applicationId === 'string' ? job.data.applicationId : null;
    if (!applicationId || !this.isFinalAttempt(job)) return;

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: job.name === 'regenerate-letter' ? undefined : 'FAILED',
        generationError: 'Die KI-Generierung ist fehlgeschlagen. Bitte versuche es erneut.',
      },
    });
  }

  private isFinalAttempt(job: Job): boolean {
    const attempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
    return job.attemptsMade >= attempts;
  }
}
