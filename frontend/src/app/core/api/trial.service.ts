import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface TrialKeywordMatch {
  keyword: string;
  matched: boolean;
}

export interface TrialResponse {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordMatches: TrialKeywordMatch[];
  summary: string;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class TrialApiService {
  private readonly api = inject(ApiService);

  analyze(cvText: string, jobText: string): Promise<TrialResponse> {
    return this.api.post<TrialResponse>('/trial', { cvText, jobText });
  }
}
