import { Injectable, inject, signal } from '@angular/core';

import type { Media } from '../models/media.model';
import type { Review } from '../models/review.model';
import type { UserRole } from '../models/user.model';
import { ApiService } from './api.service';
import { MediaService } from './media.service';

export interface RatingSummary {
  average: number;
  count: number;
}

export interface NewReview {
  mediaId: string;
  rating: number;
  comment: string;
}

interface MineResponse {
  reviews: Review[];
  media: Media[];
}

/**
 * Reseñas compartidas entre todas las cuentas.
 * Se cargan desde la nube junto con la biblioteca del usuario.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);
  private readonly media = inject(MediaService);

  private readonly reviewsSignal = signal<Review[]>([]);

  readonly reviews = this.reviewsSignal.asReadonly();

  init(): Promise<void> {
    return this.loadMine();
  }

  getByMedia(mediaId: string): Review[] {
    return this.reviewsSignal()
      .filter((review) => review.mediaId === mediaId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getByUser(userId: string): Review[] {
    return this.reviewsSignal()
      .filter((review) => review.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getByMediaAndUser(mediaId: string, userId: string): Review | undefined {
    return this.reviewsSignal().find(
      (review) => review.mediaId === mediaId && review.userId === userId
    );
  }

  getById(id: string): Review | undefined {
    return this.reviewsSignal().find((review) => review.id === id);
  }

  async add(data: NewReview): Promise<Review> {
    const response = await this.api.request<{ review: Review }>(
      'POST',
      `/api/media/${encodeURIComponent(data.mediaId)}/reviews`,
      { rating: data.rating, comment: data.comment }
    );
    this.merge([response.review]);
    return response.review;
  }

  async update(
    id: string,
    changes: { rating: number; comment: string }
  ): Promise<Review | undefined> {
    const response = await this.api.request<{ review: Review }>(
      'PATCH',
      `/api/reviews/${encodeURIComponent(id)}`,
      changes
    );
    this.merge([response.review]);
    return response.review;
  }

  async remove(id: string): Promise<void> {
    await this.api.request('DELETE', `/api/reviews/${encodeURIComponent(id)}`);
    this.reviewsSignal.update((reviews) => reviews.filter((review) => review.id !== id));
  }

  /** Carga las reseñas propias y los títulos asociados (aunque ya no estén en la biblioteca). */
  async loadMine(): Promise<void> {
    const response = await this.api.request<MineResponse>('GET', '/api/reviews/mine');
    this.media.setCatalog(response.media);
    this.merge(response.reviews);
  }

  /** Mezcla reseñas por id para actualizar el estado sin borrar otras ya cargadas. */
  merge(reviews: Review[]): void {
    this.reviewsSignal.update((current) => {
      const byId = new Map(current.map((review) => [review.id, review]));
      for (const review of reviews) {
        byId.set(review.id, review);
      }
      return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  clear(): void {
    this.reviewsSignal.set([]);
  }

  /** Promedio de puntajes. Si se indica rol, separa usuarios de críticos. */
  averageFor(mediaId: string, role?: UserRole): RatingSummary {
    const reviews = this.reviewsSignal().filter(
      (review) => review.mediaId === mediaId && (!role || review.authorRole === role)
    );
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return { average: total / reviews.length, count: reviews.length };
  }
}
