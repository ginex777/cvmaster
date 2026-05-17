export type ApplicationStatus =
  | 'DRAFT'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED';

export const STATUS_META: Record<ApplicationStatus, {
  label: string;
  color: string;
  bg: string;
  short: string;
  order: number;
}> = {
  DRAFT:     { label: 'Entwurf',   color: 'var(--status-draft)',     bg: 'var(--status-draft-bg)',     short: 'ENT', order: 0 },
  APPLIED:   { label: 'Beworben',  color: 'var(--status-applied)',   bg: 'var(--status-applied-bg)',   short: 'BEW', order: 1 },
  INTERVIEW: { label: 'Interview', color: 'var(--status-interview)', bg: 'var(--status-interview-bg)', short: 'INT', order: 2 },
  OFFER:     { label: 'Angebot',   color: 'var(--status-offer)',     bg: 'var(--status-offer-bg)',     short: 'ANG', order: 3 },
  REJECTED:  { label: 'Abgesagt',  color: 'var(--status-rejected)',  bg: 'var(--status-rejected-bg)',  short: 'ABS', order: 4 },
};

export const STATUS_ORDER: ApplicationStatus[] = ['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
