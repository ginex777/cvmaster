export interface TrialRequest {
  cvText: string;
  jobText: string;
}

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
