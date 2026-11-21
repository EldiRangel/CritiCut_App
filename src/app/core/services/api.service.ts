import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { STORAGE_KEYS } from '../constants/app.constants';
import { StorageService } from './storage.service';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * Cliente único de la API en la nube.
 * Adjunta el token JWT de la sesión y traduce los errores del servidor
 * a mensajes que se pueden mostrar directamente en la interfaz.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private token: string | null = null;

  async loadToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    this.token = await this.storage.get<string>(STORAGE_KEYS.token);
    return this.token;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await this.storage.set(STORAGE_KEYS.token, token);
    } else {
      await this.storage.remove(STORAGE_KEYS.token);
    }
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const token = await this.loadToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (body !== undefined) {
      headers = headers.set('Content-Type', 'application/json');
    }

    try {
      return await firstValueFrom(
        this.http.request<T>(method, `${this.baseUrl}${path}`, {
          body: body ?? null,
          headers
        })
      );
    } catch (error) {
      throw new Error(this.messageFor(error));
    }
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No hay conexión con el servidor. Revisa tu internet.';
      }
      const serverMessage = error.error?.error;
      if (typeof serverMessage === 'string' && serverMessage.trim()) {
        return serverMessage;
      }
      if (error.status === 401) {
        return 'Tu sesión expiró. Inicia sesión de nuevo.';
      }
      return 'El servidor no pudo completar la solicitud.';
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }
}
