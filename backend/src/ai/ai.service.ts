import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { LLMProvider, ParsedCVSchema, ParsedJobSchema, ParsedCV, ParsedJob } from './provider';
import { ClaudeProvider } from './claude.provider';
import { GroqProvider } from './groq.provider';
import { PrismaService } from '../common/prisma.service';

const MAX_RETRIES = 3;
const AI_AUDIT_RETENTION_DAYS = 30;
const REDACTED_PROMPT = '[redacted: prompt contains user-provided application data]';
const PROMPT_VERSION = 'redacted-v1';

interface AiAuditContext {
  userId?: string;
  applicationId?: string;
}

function loadPrompt(name: string): string {
  return readFileSync(join(process.cwd(), 'prompts', `${name}.txt`), 'utf8');
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

@Injectable()
export class AiService {
  private provider: LLMProvider;
  private providerName: string;
  private modelName: string;

  constructor(private prisma: PrismaService) {
    const p = process.env.AI_PROVIDER ?? 'groq';
    this.providerName = p;
    this.modelName = this.defaultModelName(p);
    this.provider = p === 'claude'
      ? new ClaudeProvider(requiredEnv('ANTHROPIC_API_KEY'))
      : new GroqProvider(requiredEnv('GROQ_API_KEY'));
  }

  async parseCv(text: string, audit: AiAuditContext = {}): Promise<ParsedCV> {
    return this.withAudit('parse_cv', audit, () => this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('cv-parser'),
        user: `<<<CV_TEXT>>>\n${text}\n<<<END>>>`,
        schema: ParsedCVSchema,
      })
    ));
  }

  async parseJob(text: string, audit: AiAuditContext = {}): Promise<ParsedJob> {
    return this.withAudit('parse_job', audit, () => this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('job-parser'),
        user: `<<<JOB_AD>>>\n${text}\n<<<END>>>`,
        schema: ParsedJobSchema,
      })
    ));
  }

  async optimizeCv(cv: ParsedCV, job: ParsedJob, audit: AiAuditContext = {}): Promise<ParsedCV> {
    return this.withAudit('optimize_cv', audit, () => this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('optimizer'),
        user: JSON.stringify({ cv, job }),
        schema: ParsedCVSchema,
      })
    ));
  }

  async generateCoverLetter(
    cv: ParsedCV,
    job: ParsedJob,
    audit: AiAuditContext = {},
  ): Promise<{ concise: string; warm: string; formal: string }> {
    const schema = z.object({
      concise: z.string(),
      warm:    z.string(),
      formal:  z.string(),
    });
    return this.withAudit('generate_cover_letter', audit, () => this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('letter-generator'),
        user: JSON.stringify({ cv, job }),
        schema,
      })
    ));
  }

  private async withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      return this.withRetry(fn, attempt + 1);
    }
  }

  private async withAudit<T>(type: string, context: AiAuditContext, fn: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    const retentionUntil = this.retentionDeadline();
    const auditJob = await this.prisma.aiJob.create({
      data: {
        userId: context.userId,
        applicationId: context.applicationId,
        type,
        state: 'RUNNING',
        prompt: REDACTED_PROMPT,
        promptVersion: PROMPT_VERSION,
        modelName: this.modelName,
        provider: this.providerName,
        retentionUntil,
      },
      select: { id: true },
    });

    try {
      const result = await fn();
      await this.prisma.aiJob.update({
        where: { id: auditJob.id },
        data: {
          state: 'SUCCEEDED',
          finishedAt: new Date(),
          response: this.auditMetadata(startedAt, retentionUntil),
        },
      });
      return result;
    } catch (error: unknown) {
      await this.prisma.aiJob.update({
        where: { id: auditJob.id },
        data: {
          state: 'FAILED',
          finishedAt: new Date(),
          error: this.errorCategory(error),
          response: this.auditMetadata(startedAt, retentionUntil),
        },
      });
      throw error;
    }
  }

  private auditMetadata(startedAt: number, retentionUntil: Date) {
    return {
      durationMs: Date.now() - startedAt,
      retentionUntil: retentionUntil.toISOString(),
      output: 'redacted',
    };
  }

  private retentionDeadline(): Date {
    return new Date(Date.now() + AI_AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  }

  private errorCategory(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('schema validation')) return 'output_validation_failed';
    if (message.includes('invalid JSON')) return 'invalid_json';
    if (message.match(/error\s+[45]\d\d/i)) return 'provider_http_error';
    return 'ai_generation_failed';
  }

  private defaultModelName(provider: string): string {
    if (provider === 'claude') return process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';
    return process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
  }
}
