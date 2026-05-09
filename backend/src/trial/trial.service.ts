import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { MatchScoringService } from '../match/match-scoring.service';
import { TrialRequest, TrialResponse } from './trial.types';

const PREVIEW_LENGTH = 200;

@Injectable()
export class TrialService {
  constructor(
    private readonly ai: AiService,
    private readonly scoring: MatchScoringService,
  ) {}

  async run(data: TrialRequest): Promise<TrialResponse> {
    const cv = await this.ai.parseCv(data.cvText);
    const job = await this.ai.parseJob(data.jobText);
    const optimizedCv = await this.ai.optimizeCv(cv, job);
    const coverLetter = await this.ai.generateCoverLetter(optimizedCv, job);

    const result = this.scoring.score(optimizedCv, job);

    return {
      atsScore: result.score,
      matchScore: result.score,
      keywords: [...result.matchedKeywords, ...result.missingKeywords],
      coverLetterPreview: this.preview(coverLetter.formal || coverLetter.warm || coverLetter.concise),
      summary: result.summary,
      suggestions: this.suggestions(result.missingKeywords),
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      keywordMatches: [...result.matchedKeywords, ...result.missingKeywords].map(keyword => ({
        keyword,
        matched: result.matchedKeywords.includes(keyword),
      })),
    };
  }

  async analyze(data: TrialRequest): Promise<TrialResponse> {
    return this.run(data);
  }

  private preview(value: string): string {
    const trimmed = value.trim();
    return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH).trim()}...` : trimmed;
  }

  private suggestions(missingKeywords: string[]): string[] {
    if (!missingKeywords.length) {
      return ['Ergaenze konkrete Ergebnisse und Zahlen, damit der starke Fit im CV noch belastbarer wirkt.'];
    }
    return [
      `Ergaenze sichtbare Erfahrung zu: ${missingKeywords.slice(0, 5).join(', ')}.`,
      'Spiegle die wichtigsten Begriffe aus der Anzeige in Zusammenfassung und Skills-Bereich.',
    ];
  }
}
