import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type UserPlan = 'FREE' | 'PAY_PER_APP' | 'PRO' | 'free' | 'pay' | 'pro';

interface User {
  id: string;
  email: string;
  name: string;
  plan: UserPlan;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  onboardingShown: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private accessToken = signal<string | null>(null);
  user = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.user());

  async login(email: string, password: string, totp?: string) {
    const res = await firstValueFrom(
      this.http.post<{ accessToken: string; user: User }>(
        '/api/auth/login',
        { email, password, totp },
        { withCredentials: true }
      )
    );
    this.accessToken.set(res.accessToken);
    this.user.set(res.user);
  }

  async refresh() {
    const res = await firstValueFrom(
      this.http.post<{ accessToken: string; user: User }>('/api/auth/refresh', {}, { withCredentials: true })
    );
    this.accessToken.set(res.accessToken);
    this.user.set(res.user);
  }

  async logout() {
    await firstValueFrom(this.http.post('/api/auth/logout', {}, { withCredentials: true }));
    this.clearSession();
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.user.set(null);
  }

  async register(data: { name: string; email: string; password: string; art9Consent: boolean }): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/register', data));
  }

  getAccessToken() {
    return this.accessToken();
  }
}
