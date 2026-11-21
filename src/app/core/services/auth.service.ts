import { Injectable, computed, inject, signal } from '@angular/core';

import type { PublicUser, UserRole } from '../models/user.model';
import { ApiService } from './api.service';
import { LibraryService } from './library.service';
import { MediaService } from './media.service';
import { ReviewService } from './review.service';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ProfileChanges {
  name?: string;
  email?: string;
  avatar?: string;
}

interface AuthResponse {
  token: string;
  user: PublicUser;
}

/** Sesión y autenticación contra la API en la nube. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly media = inject(MediaService);
  private readonly reviews = inject(ReviewService);
  private readonly library = inject(LibraryService);

  private readonly currentUserSignal = signal<PublicUser | null>(null);
  private initPromise: Promise<void> | null = null;

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  init(): Promise<void> {
    this.initPromise ??= this.restoreSession();
    return this.initPromise;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    await this.init();
    try {
      const response = await this.api.request<AuthResponse>('POST', '/api/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });
      await this.applySession(response);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.messageFor(error) };
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    await this.init();
    try {
      const response = await this.api.request<AuthResponse>('POST', '/api/auth/register', {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role
      });
      await this.applySession(response);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.messageFor(error) };
    }
  }

  async updateProfile(changes: ProfileChanges): Promise<AuthResult> {
    const current = this.currentUserSignal();
    if (!current) {
      return { ok: false, error: 'No hay una sesión activa.' };
    }

    const payload: Record<string, string> = {};
    if (changes.name !== undefined) {
      payload['name'] = changes.name.trim();
    }
    if (changes.email !== undefined) {
      payload['email'] = changes.email.trim().toLowerCase();
    }
    if (changes.avatar !== undefined) {
      payload['avatar'] = changes.avatar;
    }

    try {
      const response = await this.api.request<{ user: PublicUser }>(
        'PATCH',
        '/api/auth/profile',
        payload
      );
      this.currentUserSignal.set(response.user);
      await this.refreshData();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.messageFor(error) };
    }
  }

  async deleteAccount(): Promise<void> {
    if (!this.currentUserSignal()) {
      return;
    }
    await this.api.request('DELETE', '/api/auth/account');
    await this.clearLocalSession();
  }

  async logout(): Promise<void> {
    await this.clearLocalSession();
  }

  private async applySession(response: AuthResponse): Promise<void> {
    await this.api.setToken(response.token);
    this.currentUserSignal.set(response.user);
    await this.refreshData();
  }

  private async refreshData(): Promise<void> {
    try {
      await this.library.reload();
      await this.reviews.loadMine();
    } catch {
      // La sesión sigue válida. Las pantallas vuelven a intentar al abrirse.
    }
  }

  private async restoreSession(): Promise<void> {
    const token = await this.api.loadToken();
    if (!token) {
      return;
    }
    try {
      const response = await this.api.request<{ user: PublicUser }>('GET', '/api/auth/me');
      this.currentUserSignal.set(response.user);
      await this.refreshData();
    } catch {
      await this.clearLocalSession();
    }
  }

  private async clearLocalSession(): Promise<void> {
    await this.api.setToken(null);
    this.currentUserSignal.set(null);
    this.library.clear();
    this.reviews.clear();
    this.media.clear();
  }

  private messageFor(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}
