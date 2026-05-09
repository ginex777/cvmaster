export interface AuthenticatedRequest {
  user: { sub: string; email: string; plan: string };
}
