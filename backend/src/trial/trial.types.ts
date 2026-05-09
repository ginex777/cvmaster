export interface TrialRequest {
  cvText: string;
  jobText: string;
}

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
