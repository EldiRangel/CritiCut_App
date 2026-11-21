import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToolbar
} from '@ionic/angular';

import { TMDB_BACKDROP_BASE, TYPE_LABELS } from '@core/constants/app.constants';
import type { Media } from '@core/models/media.model';
import { AuthService } from '@core/services/auth.service';
import { LibraryService } from '@core/services/library.service';
import { MediaService } from '@core/services/media.service';
import { ReviewService } from '@core/services/review.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { MediaCardComponent } from '@shared/components/media-card/media-card.component';
import { ScoreBadgeComponent } from '@shared/components/score-badge/score-badge.component';

type SortOption = 'rating-desc' | 'rating-asc' | 'date-desc' | 'date-asc';
type TypeFilter = 'all' | 'movie' | 'tv';

@Component({
  selector: 'app-media-list',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonIcon,
    MediaCardComponent,
    EmptyStateComponent,
    ScoreBadgeComponent
  ],
  templateUrl: './media-list.page.html',
  styleUrls: ['./media-list.page.scss']
})
export class MediaListPage {
  private readonly mediaService = inject(MediaService);
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);

  /** Solo los títulos que este usuario agregó a su catálogo. */
  readonly media = computed(() => {
    const user = this.auth.currentUser();
    if (!user) {
      return [];
    }
    return this.library
      .getForUser(user.id)
      .map((id) => this.mediaService.getById(id))
      .filter((item): item is Media => !!item);
  });

  readonly search = signal('');
  readonly category = signal('Todas');
  readonly typeFilter = signal<TypeFilter>('all');
  readonly year = signal('Todos');
  readonly minRating = signal(0);
  readonly sort = signal<SortOption>('rating-desc');
  readonly showFilters = signal(false);

  readonly user = this.auth.currentUser;

  ionViewWillEnter(): void {
    // Refresca catálogo y reseñas compartidas cada vez que se abre la pestaña.
    void this.library.reload().catch(() => undefined);
  }

  readonly firstName = computed(() => {
    const name = this.user()?.name?.trim();
    return name ? name.split(/\s+/)[0] : 'cinéfilo';
  });

  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?'
    );
  });

  readonly totalReviews = computed(() =>
    this.media().reduce((sum, item) => sum + this.reviewService.averageFor(item.id).count, 0)
  );

  readonly criticCount = computed(() => {
    const mediaIds = new Set(this.media().map((item) => item.id));
    const critics = this.reviewService
      .reviews()
      .filter((review) => mediaIds.has(review.mediaId) && review.authorRole === 'critic');
    return new Set(critics.map((review) => review.userId)).size;
  });

  readonly featured = computed<Media | null>(() => {
    const list = this.media();
    if (list.length === 0) {
      return null;
    }
    return [...list].sort(
      (a, b) =>
        this.reviewService.averageFor(b.id).average -
        this.reviewService.averageFor(a.id).average
    )[0];
  });

  readonly featuredStats = computed(() => {
    const item = this.featured();
    if (!item) {
      return {
        critic: { average: 0, count: 0 },
        audience: { average: 0, count: 0 }
      };
    }
    return {
      critic: this.reviewService.averageFor(item.id, 'critic'),
      audience: this.reviewService.averageFor(item.id, 'user')
    };
  });

  readonly activeFilters = computed(() => {
    let count = 0;
    if (this.typeFilter() !== 'all') {
      count++;
    }
    if (this.category() !== 'Todas') {
      count++;
    }
    if (this.year() !== 'Todos') {
      count++;
    }
    if (this.minRating() > 0) {
      count++;
    }
    return count;
  });

  readonly categories = computed(() => {
    const genres = this.media().flatMap((item) => item.genres);
    return ['Todas', ...Array.from(new Set(genres)).sort((a, b) => a.localeCompare(b, 'es'))];
  });

  readonly years = computed(() =>
    Array.from(
      new Set(
        this.media()
          .map((item) => (item.releaseDate || '').slice(0, 4))
          .filter((year) => !!year)
      )
    ).sort((a, b) => b.localeCompare(a))
  );

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.category();
    const type = this.typeFilter();
    const year = this.year();
    const minRating = this.minRating();

    const list = this.media().filter((item) => {
      if (term && !item.title.toLowerCase().includes(term)) {
        return false;
      }
      if (type !== 'all' && item.type !== type) {
        return false;
      }
      if (category !== 'Todas' && !item.genres.includes(category)) {
        return false;
      }
      if (year !== 'Todos' && !(item.releaseDate || '').startsWith(year)) {
        return false;
      }
      if (minRating > 0 && this.reviewService.averageFor(item.id).average < minRating) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (this.sort()) {
        case 'rating-asc':
          return (
            this.reviewService.averageFor(a.id).average -
            this.reviewService.averageFor(b.id).average
          );
        case 'date-asc':
          return (a.releaseDate || '').localeCompare(b.releaseDate || '');
        case 'date-desc':
          return (b.releaseDate || '').localeCompare(a.releaseDate || '');
        default:
          return (
            this.reviewService.averageFor(b.id).average -
            this.reviewService.averageFor(a.id).average
          );
      }
    });
  });

  averageFor(mediaId: string): number {
    return this.reviewService.averageFor(mediaId).average;
  }

  criticAverageFor(mediaId: string): number {
    return this.reviewService.averageFor(mediaId, 'critic').average;
  }

  userAverageFor(mediaId: string): number {
    return this.reviewService.averageFor(mediaId, 'user').average;
  }

  countFor(mediaId: string): number {
    return this.reviewService.averageFor(mediaId).count;
  }

  yearFor(item: Media): string {
    return (item.releaseDate || '').slice(0, 4) || '—';
  }

  typeLabelFor(item: Media): string {
    return TYPE_LABELS[item.type];
  }

  featuredImage(item: Media): string {
    const path = item.backdropPath || item.posterPath;
    return path
      ? `url(${TMDB_BACKDROP_BASE}${path})`
      : 'linear-gradient(135deg, #1f1f1f 0%, #7f1d1d 100%)';
  }

  openMedia(id: string): void {
    void this.router.navigate(['/media', id]);
  }

  goToSearch(): void {
    void this.router.navigateByUrl('/tabs/search');
  }

  goToProfile(): void {
    void this.router.navigateByUrl('/tabs/profile');
  }

  clearFilters(): void {
    this.search.set('');
    this.category.set('Todas');
    this.typeFilter.set('all');
    this.year.set('Todos');
    this.minRating.set(0);
    this.sort.set('rating-desc');
  }

  onSearchInput(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | null }>).detail?.value ?? '';
    this.search.set(value);
  }

  onYearChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | null }>).detail?.value;
    this.year.set(value ?? 'Todos');
  }

  onRatingChange(event: Event): void {
    const raw = Number((event as CustomEvent<{ value?: number | string | null }>).detail?.value ?? 0);
    this.minRating.set(Number.isFinite(raw) ? raw : 0);
  }

  onSortChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string }>).detail?.value as SortOption | undefined;
    if (value) {
      this.sort.set(value);
    }
  }
}
