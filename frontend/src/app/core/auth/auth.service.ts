import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pay' | 'pro';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
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
    this.accessToken.set(null);
    this.user.set(null);
  }

  getAccessToken() {
    return this.accessToken();
  }
}
