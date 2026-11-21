import { Injectable, inject, signal } from '@angular/core';

import type { Media } from '../models/media.model';
import type { Review } from '../models/review.model';
import { ApiService } from './api.service';
import { MediaService } from './media.service';
import { ReviewService } from './review.service';

interface LibraryPayload {
  media: Media[];
  reviews: Review[];
}

/**
 * Catálogo personal de cada usuario, almacenado en la nube.
 *
 * Los títulos viven una sola vez en `MediaService` para que las reseñas se
 * compartan entre cuentas; aquí solo se guarda qué títulos agregó cada quién.
 * Una cuenta recién creada no tiene ninguna fila de biblioteca: empieza vacía.
 */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly api = inject(ApiService);
  private readonly media = inject(MediaService);
  private readonly reviews = inject(ReviewService);

  private readonly mediaIdsSignal = signal<string[]>([]);

  /** Ids de los títulos del catálogo del usuario actual. */
  readonly mediaIds = this.mediaIdsSignal.asReadonly();

  init(): Promise<void> {
    return this.reload();
  }

  /** Vuelve a traer de la nube la biblioteca y las reseñas compartidas. */
  async reload(): Promise<void> {
    const data = await this.api.request<LibraryPayload>('GET', '/api/library');
    this.mediaIdsSignal.set(data.media.map((item) => item.id));
    this.media.setCatalog(data.media);
    this.reviews.merge(data.reviews);
  }

  getForUser(_userId: string): string[] {
    return this.mediaIdsSignal();
  }

  has(_userId: string, mediaId: string): boolean {
    return this.mediaIdsSignal().includes(mediaId);
  }

  /** Guarda el título en la nube (global) y lo agrega al catálogo del usuario. */
  async addMedia(data: Omit<Media, 'id' | 'createdAt'>): Promise<Media> {
    const response = await this.api.request<{ media: Media }>('POST', '/api/library', data);
    this.media.upsert(response.media);
    this.mediaIdsSignal.update((ids) =>
      ids.includes(response.media.id) ? ids : [response.media.id, ...ids]
    );
    return response.media;
  }

  clear(): void {
    this.mediaIdsSignal.set([]);
  }
}
