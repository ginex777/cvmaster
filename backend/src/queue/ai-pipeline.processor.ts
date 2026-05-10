import { Injectable, OnModuleInit } from '@nestjs/common';
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
  private redis: IORedis;

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private scoring: MatchScoringService,
  ) {}

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

    const originalCv = app.masterCv.parsedJson as unknown as ParsedCV;
    const parsedJob = app.jobPosting.parsedJson as unknown as ParsedJob;

    await job.updateProgress(10);

    // Step 1: Optimize CV
    const rawOptimizedCv = await this.ai.optimizeCv(originalCv, parsedJob);
    const guardedCv = filterHallucinatedSkills(rawOptimizedCv, originalCv);
    const optimizedCv = sanitizeCv(guardedCv);
    await job.updateProgress(50);

    // Step 2: Generate cover letters (3 variants)
    const rawLetter = await this.ai.generateCoverLetter(optimizedCv, parsedJob);
    const coverLetter = sanitizeLetter(rawLetter);
    await job.updateProgress(85);

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
      data: { optimizedCv, coverLetter, matchScore: result.score, matchReport, status: 'OPEN' },
    });

    await job.updateProgress(100);
  }
}
