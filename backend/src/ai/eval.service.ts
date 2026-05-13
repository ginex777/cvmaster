import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  FIXTURE_CV_TEXT,
  FIXTURE_JOB_TEXT,
  FIXTURE_CV,
  FIXTURE_JOB,
  BIAS_VARIANTS,
} from './eval.fixtures';
import type { ParsedCV } from './provider';

export interface FixtureResult {
  name: string;
  status: 'pass' | 'fail';
  durationMs: number;
  error?: string;
}

export interface BiasFixtureResult {
  variant: string;
  name: string;
  sectionCount: number;
  bulletCount: number;
  status: 'pass' | 'fail';
  error?: string;
}

export interface EvalReport {
  timestamp: string;
  provider: string;
  model: string;
  fixtures: FixtureResult[];
  biasFixtures: BiasFixtureResult[];
  schemaFailureRate: number;
  summary: string;
}

@Injectable()
export class EvalService {
  constructor(private readonly ai: AiService) {}

  async runEval(): Promise<EvalReport> {
    const fixtures: FixtureResult[] = [];
    const biasFixtures: BiasFixtureResult[] = [];

    fixtures.push(await this.runFixture('parseCv', () => this.ai.parseCv(FIXTURE_CV_TEXT)));
    fixtures.push(await this.runFixture('parseJob', () => this.ai.parseJob(FIXTURE_JOB_TEXT)));
    fixtures.push(await this.runFixture('optimizeCv', () => this.ai.optimizeCv(FIXTURE_CV, FIXTURE_JOB)));
    fixtures.push(await this.runFixture('generateCoverLetter', () => this.ai.generateCoverLetter(FIXTURE_CV, FIXTURE_JOB)));

    for (const { variant, name } of BIAS_VARIANTS) {
      biasFixtures.push(await this.runBiasFixture(variant, name));
    }

    const total = fixtures.length + biasFixtures.length;
    const failed = [...fixtures, ...biasFixtures].filter(f => f.status === 'fail').length;
    const schemaFailureRate = total > 0 ? failed / total : 0;

    const passCount = total - failed;
    const summary = `${passCount}/${total} fixtures passed (schema failure rate: ${(schemaFailureRate * 100).toFixed(1)}%)`;

    return {
      timestamp: new Date().toISOString(),
      provider: process.env.AI_PROVIDER ?? 'groq',
      model: process.env.GROQ_MODEL ?? process.env.CLAUDE_MODEL ?? 'unknown',
      fixtures,
      biasFixtures,
      schemaFailureRate,
      summary,
    };
  }

  private async runFixture<T>(name: string, fn: () => Promise<T>): Promise<FixtureResult> {
    const start = Date.now();
    try {
      await fn();
      return { name, status: 'pass', durationMs: Date.now() - start };
    } catch (err: unknown) {
      return {
        name,
        status: 'fail',
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async runBiasFixture(variant: string, name: string): Promise<BiasFixtureResult> {
    const cv: ParsedCV = {
      ...FIXTURE_CV,
      name,
    };
    try {
      const result = await this.ai.optimizeCv(cv, FIXTURE_JOB);
      const sectionCount = result.experience.length;
      const bulletCount = result.experience.reduce((sum, exp) => sum + exp.bullets.length, 0);
      return { variant, name, sectionCount, bulletCount, status: 'pass' };
    } catch (err: unknown) {
      return {
        variant,
        name,
        sectionCount: 0,
        bulletCount: 0,
        status: 'fail',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
