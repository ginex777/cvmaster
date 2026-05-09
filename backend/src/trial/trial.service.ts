import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { ParsedCV, ParsedJob } from '../ai/provider';
import { TrialRequest, TrialResponse } from './trial.types';

const PREVIEW_LENGTH = 200;

@Injectable()
export class TrialService {
  constructor(private readonly ai: AiService) {}

  async run(data: TrialRequest): Promise<TrialResponse> {
    const cv = await this.ai.parseCv(data.cvText);
    const job = await this.ai.parseJob(data.jobText);
    const optimizedCv = await this.ai.optimizeCv(cv, job);
    const coverLetter = await this.ai.generateCoverLetter(optimizedCv, job);
    const keywords = this.keywordsFor(job);
    const matchedKeywords = this.matchedKeywords(optimizedCv, keywords);
    const missingKeywords = keywords.filter(keyword => !matchedKeywords.includes(keyword));
    const atsScore = this.score(matchedKeywords.length, keywords.length);

    return {
      atsScore,
      matchScore: atsScore,
      keywords,
      coverLetterPreview: this.preview(coverLetter.formal || coverLetter.warm || coverLetter.concise),
      summary: this.summary(atsScore, matchedKeywords.length, missingKeywords.length),
      suggestions: this.suggestions(missingKeywords),
      matchedKeywords,
      missingKeywords,
      keywordMatches: keywords.map(keyword => ({ keyword, matched: matchedKeywords.includes(keyword) })),
    };
  }

  async analyze(data: TrialRequest): Promise<TrialResponse> {
    return this.run(data);
  }

  private keywordsFor(job: ParsedJob): string[] {
    return [...new Set([...job.skills, ...job.mustHaves])].slice(0, 12);
  }

  private matchedKeywords(cv: ParsedCV, keywords: string[]): string[] {
    const haystack = [
      cv.summary,
      ...cv.skills,
      ...cv.experience.flatMap(item => [item.company, item.role, ...item.bullets.map(bullet => bullet.text)]),
      ...cv.education.flatMap(item => [item.institution, item.degree, item.field ?? '']),
    ].join(' ').toLocaleLowerCase('de-DE');

    return keywords.filter(keyword => haystack.includes(keyword.toLocaleLowerCase('de-DE')));
  }

  private score(matched: number, total: number): number {
    return total ? Math.round((matched / total) * 100) : 0;
  }

  private preview(value: string): string {
    const trimmed = value.trim();
    return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH).trim()}...` : trimmed;
  }

  private summary(atsScore: number, matchedCount: number, missingCount: number): string {
    if (atsScore >= 80) {
      return `Starker Fit: ${matchedCount} zentrale Anforderungen sind in deinem optimierten Profil sichtbar.`;
    }

    if (atsScore >= 50) {
      return `Solide Basis: ${matchedCount} Anforderungen passen, ${missingCount} wichtige Signale fehlen noch.`;
    }

    return `Ausbaufaehiger Fit: Die Stellenanzeige nutzt noch mehrere Signale, die der CV klarer aufnehmen sollte.`;
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
