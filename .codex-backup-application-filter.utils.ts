import type { PipelineFilter } from '../components/pipeline-toolbar/pipeline-toolbar';

export interface FilterableApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  reminderAt?: string | null;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

export function withApplicationStatus<T extends FilterableApplication>(apps: T[], id: string, status: string): T[] {
  return apps.map(app => app.id === id ? { ...app, status } : app);
}

export function withApplicationReminder<T extends FilterableApplication>(apps: T[], id: string, reminderAt: string | null): T[] {
  return apps.map(app => app.id === id ? { ...app, reminderAt } : app);
}

export function filterApplications<T extends FilterableApplication>(apps: T[], filter: PipelineFilter): T[] {
  const { query, minScore, hasReminder, dateRange, statuses } = filter;
  const q = query.trim().toLowerCase();

  return apps.filter(app => {
    if (minScore !== null && (app.matchScore ?? 0) < minScore) return false;
    if (hasReminder === true && !app.reminderAt) return false;
    if (statuses !== null && !statuses.includes(app.status as never)) return false;

    if (q) {
      const title = (app.jobPosting?.parsedJson?.title ?? '').toLowerCase();
      const company = (app.jobPosting?.parsedJson?.company ?? '').toLowerCase();
      if (!title.includes(q) && !company.includes(q)) return false;
    }

    if (dateRange) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (dateRange === 'week' ? 7 : 30));
      if (new Date(app.createdAt) < cutoff) return false;
    }

    return true;
  });
}
