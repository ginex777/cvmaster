import { Injectable } from '@nestjs/common';
import { TrialRequest, TrialResponse } from './trial.types';

const MIN_WORD_LENGTH = 3;
const MAX_KEYWORDS = 14;
const STOP_WORDS = new Set([
  'aber',
  'als',
  'and',
  'auf',
  'aus',
  'bei',
  'bis',
  'das',
  'der',
  'des',
  'die',
  'ein',
  'eine',
  'for',
  'für',
  'mit',
  'of',
  'oder',
  'the',
  'und',
  'von',
  'wir',
  'you',
  'zur',
]);

@Injectable()
export class TrialService {
  analyze(data: TrialRequest): TrialResponse {
    const cvTokens = new Set(this.tokenize(data.cvText));
    const jobKeywords = this.extractKeywords(data.jobText);

    const keywordMatches = jobKeywords.map(keyword => ({
      keyword,
      matched: cvTokens.has(keyword),
    }));
    const matchedKeywords = keywordMatches.filter(item => item.matched).map(item => item.keyword);
    const missingKeywords = keywordMatches.filter(item => !item.matched).map(item => item.keyword);
    const matchScore = keywordMatches.length
      ? Math.round((matchedKeywords.length / keywordMatches.length) * 100)
      : 0;

    return {
      matchScore,
      matchedKeywords,
      missingKeywords,
      keywordMatches,
      summary: this.buildSummary(matchScore, matchedKeywords.length, missingKeywords.length),
      suggestions: this.buildSuggestions(missingKeywords),
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLocaleLowerCase('de-DE')
      .replace(/[^\p{L}\p{N}+#. -]/gu, ' ')
      .split(/[\s,;:()/"']+/)
      .map(token => token.trim())
      .filter(token => token.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(token));
  }

  private extractKeywords(text: string): string[] {
    const counts = new Map<string, number>();

    for (const token of this.tokenize(text)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1] || second[0].length - first[0].length)
      .slice(0, MAX_KEYWORDS)
      .map(([keyword]) => keyword);
  }

  private buildSummary(matchScore: number, matchedCount: number, missingCount: number): string {
    if (matchScore >= 80) {
      return `Starker Fit: ${matchedCount} zentrale Signale aus der Anzeige sind bereits im CV sichtbar.`;
    }

    if (matchScore >= 50) {
      return `Solide Basis: ${matchedCount} Signale passen, ${missingCount} wichtige Begriffe fehlen noch.`;
    }

    return `Ausbaufähiger Fit: Die Anzeige nutzt noch mehrere Begriffe, die im CV nicht klar vorkommen.`;
  }

  private buildSuggestions(missingKeywords: string[]): string[] {
    const topMissing = missingKeywords.slice(0, 5);

    if (topMissing.length === 0) {
      return [
        'Schärfe die Bulletpoints mit konkreten Ergebnissen, Zahlen und Verantwortungsbereichen.',
        'Passe die Reihenfolge deiner Skills an die Sprache der Stellenanzeige an.',
      ];
    }

    return [
      `Ergänze relevante Erfahrung zu: ${topMissing.join(', ')}.`,
      'Formuliere mindestens zwei Bulletpoints näher an den Begriffen der Stellenanzeige.',
      'Platziere die wichtigsten fehlenden Skills in Zusammenfassung oder Skills-Bereich.',
    ];
  }
}
