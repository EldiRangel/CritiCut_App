import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * Envoltorio de Ionic Storage.
 * Centraliza la inicialización y el acceso a la base de datos local
 * (IndexedDB en web / almacenamiento del WebView en Android).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(Storage);
  private initPromise: Promise<void> | null = null;

  init(): Promise<void> {
    this.initPromise ??= this.storage.create().then(() => undefined);
    return this.initPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    const value = await this.storage.get(key);
    return (value as T | null) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.init();
    await this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.init();
    await this.storage.remove(key);
  }
}
