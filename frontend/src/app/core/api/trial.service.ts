import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface TrialKeywordMatch {
  keyword: string;
  matched: boolean;
}

export interface TrialResponse {
  atsScore: number;
  matchScore: number;
  keywords: string[];
  coverLetterPreview: string;
  summary: string;
  suggestions: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordMatches: TrialKeywordMatch[];
}

@Injectable({ providedIn: 'root' })
export class TrialApiService {
  private readonly api = inject(ApiService);

  analyze(cvText: string, jobText: string): Promise<TrialResponse> {
    return this.api.post<TrialResponse>('/trial', { cvText, jobText });
  }
}
