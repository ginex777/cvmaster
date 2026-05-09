import { Injectable } from '@nestjs/common';
import type { ParsedCV, ParsedJob } from '../ai/provider';

export interface MatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  strengths: string[];
  risks: string[];
}

@Injectable()
export class MatchScoringService {
  score(cv: ParsedCV, job: ParsedJob): MatchResult {
    const mustHaves = job.mustHaves ?? [];
    const skills = job.skills ?? [];
    const corpus = this.buildCorpus(cv);

    const matchedMustHaves = mustHaves.filter(k => corpus.includes(k.toLowerCase()));
    const matchedSkills = skills.filter(k => corpus.includes(k.toLowerCase()));

    // mustHaves count double in the weighted total
    const totalWeight = mustHaves.length * 2 + skills.length;
    const matchedWeight = matchedMustHaves.length * 2 + matchedSkills.length;
    const score = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0;

    const allKeywords = [...new Set([...mustHaves, ...skills])];
    const matchedKeywords = allKeywords.filter(k => corpus.includes(k.toLowerCase()));
    const missingKeywords = allKeywords.filter(k => !corpus.includes(k.toLowerCase()));
    const missingMustHaves = mustHaves.filter(k => !corpus.includes(k.toLowerCase()));

    return {
      score,
      matchedKeywords,
      missingKeywords,
      summary: this.buildSummary(score, matchedKeywords.length, missingKeywords.length),
      strengths: matchedMustHaves.slice(0, 3),
      risks: missingMustHaves.slice(0, 3),
    };
  }

  buildCorpus(cv: ParsedCV): string {
    return [
      cv.summary ?? '',
      ...(cv.skills ?? []),
      ...(cv.experience ?? []).flatMap(e => [e.role, e.company, ...(e.bullets ?? []).map(b => b.text)]),
      ...(cv.education ?? []).flatMap(e => [e.institution, e.degree, e.field ?? '']),
      ...(cv.certifications ?? []),
    ].join(' ').toLowerCase();
  }

  private buildSummary(score: number, matched: number, missing: number): string {
    if (score >= 80) return `Starker Fit: ${matched} Anforderungen sind klar sichtbar.`;
    if (score >= 50) return `Solide Basis: ${matched} Anforderungen passen, ${missing} wichtige Signale fehlen noch.`;
    return `Ausbaufähiger Fit: ${missing} wichtige Anforderungen fehlen noch im optimierten Profil.`;
  }
}
