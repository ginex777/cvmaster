export interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  reminderAt?: string | null;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

export interface DashboardData {
  applicationCount: number;
  avgMatchScore: number | null;
  cvCount: number;
  onboardingDismissed: boolean;
  recentApplications: Application[];
}
