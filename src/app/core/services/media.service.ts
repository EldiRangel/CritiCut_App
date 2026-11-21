import { Injectable, signal } from '@angular/core';

import type { Media, MediaType } from '../models/media.model';

/**
 * Catálogo de títulos que el usuario tiene en su biblioteca.
 * Los datos viven en la nube; aquí se mantiene una copia reactiva
 * para que las pantallas puedan consultarlos de forma síncrona.
 */
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly mediaSignal = signal<Media[]>([]);

  readonly media = this.mediaSignal.asReadonly();

  init(): Promise<void> {
    return Promise.resolve();
  }

  getAll(): Media[] {
    return this.mediaSignal();
  }

  getById(id: string): Media | undefined {
    return this.mediaSignal().find((media) => media.id === id);
  }

  findByTmdb(tmdbId: number, type: MediaType): Media | undefined {
    return this.mediaSignal().find((media) => media.tmdbId === tmdbId && media.type === type);
  }

  /** Incorpora los títulos recibidos de la API sin duplicarlos. */
  setCatalog(items: Media[]): void {
    this.mediaSignal.update((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      for (const item of items) {
        byId.set(item.id, item);
      }
      return [...byId.values()];
    });
  }

  upsert(item: Media): void {
    this.mediaSignal.update((current) => {
      const exists = current.some((media) => media.id === item.id);
      return exists
        ? current.map((media) => (media.id === item.id ? item : media))
        : [item, ...current];
    });
  }

  clear(): void {
    this.mediaSignal.set([]);
  }
}
