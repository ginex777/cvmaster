import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { LLMProvider, ParsedCVSchema, ParsedJobSchema, ParsedCV, ParsedJob } from './provider';
import { MistralProvider } from './mistral.provider';
import { ClaudeProvider } from './claude.provider';

const MAX_RETRIES = 3;

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

  constructor() {
    const p = process.env.AI_PROVIDER ?? 'mistral';
    this.provider = p === 'claude'
      ? new ClaudeProvider(requiredEnv('ANTHROPIC_API_KEY'))
      : new MistralProvider(requiredEnv('MISTRAL_API_KEY'));
  }

  async parseCv(text: string): Promise<ParsedCV> {
    return this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('cv-parser'),
        user: `<<<CV_TEXT>>>\n${text}\n<<<END>>>`,
        schema: ParsedCVSchema,
      })
    );
  }

  async parseJob(text: string): Promise<ParsedJob> {
    return this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('job-parser'),
        user: `<<<JOB_AD>>>\n${text}\n<<<END>>>`,
        schema: ParsedJobSchema,
      })
    );
  }

  async optimizeCv(cv: ParsedCV, job: ParsedJob): Promise<ParsedCV> {
    return this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('optimizer'),
        user: JSON.stringify({ cv, job }),
        schema: ParsedCVSchema,
      })
    );
  }

  async generateCoverLetter(cv: ParsedCV, job: ParsedJob): Promise<{ concise: string; warm: string; formal: string }> {
    const schema = z.object({
      concise: z.string(),
      warm:    z.string(),
      formal:  z.string(),
    });
    return this.withRetry(() =>
      this.provider.generate({
        system: loadPrompt('letter-generator'),
        user: JSON.stringify({ cv, job }),
        schema,
      })
    );
  }

  private async withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      return this.withRetry(fn, attempt + 1);
    }
  }
}
