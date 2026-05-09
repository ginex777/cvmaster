import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  get<T>(path: string, params?: Record<string, string>) {
    return firstValueFrom(
      this.http.get<T>(`${this.base}${path}`, {
        params: params ? new HttpParams({ fromObject: params }) : undefined,
        withCredentials: true,
      })
    );
  }

  getBlob(path: string) {
    return firstValueFrom(
      this.http.get(`${this.base}${path}`, {
        responseType: 'blob',
        withCredentials: true,
      })
    );
  }

  post<T>(path: string, body: unknown) {
    return firstValueFrom(
      this.http.post<T>(`${this.base}${path}`, body, { withCredentials: true })
    );
  }

  patch<T>(path: string, body: unknown) {
    return firstValueFrom(
      this.http.patch<T>(`${this.base}${path}`, body, { withCredentials: true })
    );
  }

  upload<T>(path: string, form: FormData) {
    return firstValueFrom(
      this.http.post<T>(`${this.base}${path}`, form, { withCredentials: true })
    );
  }

  delete<T>(path: string) {
    return firstValueFrom(
      this.http.delete<T>(`${this.base}${path}`, { withCredentials: true })
    );
  }
}
