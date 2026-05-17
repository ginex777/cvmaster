export function scoreClass(score: number): string {
  if (score >= 80) return 'score--high';
  if (score >= 60) return 'score--mid';
  return 'score--low';
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--status-offer)';
  if (score >= 60) return 'var(--status-applied)';
  return 'var(--warn)';
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'oklch(95% 0.04 155)';
  if (score >= 60) return 'oklch(95% 0.025 240)';
  return 'oklch(96% 0.03 60)';
}

export function scoreLabel(score: number): 'Stark' | 'Gut' | 'Verbesserbar' {
  if (score >= 80) return 'Stark';
  if (score >= 60) return 'Gut';
  return 'Verbesserbar';
}
