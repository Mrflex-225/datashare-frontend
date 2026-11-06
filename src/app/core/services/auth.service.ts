import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  expiresIn: number;
}

export interface RegisterResponse {
  id: number;
  email: string;
  createdAt: string;
}

interface JwtPayload {
  sub?: string;
  exp?: number;
}

export const TOKEN_KEY = 'datashare_token';
export const TOKEN_EXPIRY_KEY = 'datashare_token_expires_at';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  readonly isAuthenticated = signal(this.hasValidToken());

  // Le backend renvoie le JWT en texte brut ; le format JSON du contrat est aussi accepté.
  login(credentials: AuthCredentials): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/login`, credentials, { responseType: 'text' })
      .pipe(map((body) => this.storeToken(body)));
  }

  register(credentials: AuthCredentials): Observable<RegisterResponse | null> {
    return this.http.post<RegisterResponse | null>(`${this.apiUrl}/register`, credentials);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return this.hasValidToken() ? localStorage.getItem(TOKEN_KEY) : null;
  }

  getUserEmail(): string | null {
    const token = this.getToken();
    return token ? (this.readPayload(token)?.sub ?? null) : null;
  }

  private storeToken(body: string): string {
    const { token, expiresIn } = this.parseLoginBody(body);
    if (!token) {
      throw new Error('Réponse de connexion sans token');
    }

    const exp = this.readPayload(token)?.exp;
    const expiresAt =
      expiresIn !== undefined
        ? Date.now() + expiresIn * 1000
        : exp !== undefined
          ? exp * 1000
          : Date.now() + DEFAULT_TTL_MS;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
    this.isAuthenticated.set(true);
    return token;
  }

  private parseLoginBody(body: string): { token: string; expiresIn?: number } {
    const raw = body.trim();
    try {
      const json = JSON.parse(raw) as Partial<LoginResponse> | string;
      return typeof json === 'string' ? { token: json } : { token: json.token ?? '', expiresIn: json.expiresIn };
    } catch {
      return { token: raw };
    }
  }

  private readPayload(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRY_KEY));
    return !!token && expiresAt > Date.now();
  }
}
