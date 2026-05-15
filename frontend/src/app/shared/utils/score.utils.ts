export function scoreClass(score: number): string {
  if (score >= 80) return 'score--high';
  if (score >= 60) return 'score--mid';
  return 'score--low';
}
