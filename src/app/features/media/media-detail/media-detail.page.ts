import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular';

import {
  TMDB_BACKDROP_BASE,
  TMDB_IMAGE_BASE,
  TYPE_LABELS
} from '@core/constants/app.constants';
import type { Review } from '@core/models/review.model';
import { AuthService } from '@core/services/auth.service';
import { LibraryService } from '@core/services/library.service';
import { MediaService } from '@core/services/media.service';
import { ReviewService } from '@core/services/review.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ReviewListComponent } from '@shared/components/review-list/review-list.component';
import { ScoreBadgeComponent } from '@shared/components/score-badge/score-badge.component';
import { StarRatingComponent } from '@shared/components/star-rating/star-rating.component';

type ReviewFilter = 'all' | 'user' | 'critic';

@Component({
  selector: 'app-media-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonFooter,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    ScoreBadgeComponent,
    ReviewListComponent,
    EmptyStateComponent,
    StarRatingComponent
  ],
  templateUrl: './media-detail.page.html',
  styleUrls: ['./media-detail.page.scss']
})
export class MediaDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mediaService = inject(MediaService);
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly alertCtrl = inject(AlertController);

  readonly mediaId = this.route.snapshot.paramMap.get('id') ?? '';

  /** La ficha solo es visible si el título está en el catálogo del usuario. */
  readonly media = computed(() => {
    const user = this.auth.currentUser();
    if (!user || !this.library.has(user.id, this.mediaId)) {
      return undefined;
    }
    return this.mediaService.getById(this.mediaId);
  });
  readonly reviews = computed(() => this.reviewService.getByMedia(this.mediaId));
  readonly userRating = computed(() => this.reviewService.averageFor(this.mediaId, 'user'));
  readonly criticRating = computed(() => this.reviewService.averageFor(this.mediaId, 'critic'));
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly reviewFilter = signal<ReviewFilter>('all');

  readonly userCount = computed(
    () => this.reviews().filter((review) => review.authorRole === 'user').length
  );
  readonly criticCount = computed(
    () => this.reviews().filter((review) => review.authorRole === 'critic').length
  );

  readonly filteredReviews = computed(() => {
    const filter = this.reviewFilter();
    const list = this.reviews();
    return filter === 'all' ? list : list.filter((review) => review.authorRole === filter);
  });

  readonly topCriticReview = computed(() => this.topReview('critic'));
  readonly topUserReview = computed(() => this.topReview('user'));

  readonly myReview = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.reviewService.getByMediaAndUser(this.mediaId, user.id) : undefined;
  });

  readonly typeLabel = computed(() => {
    const media = this.media();
    return media ? TYPE_LABELS[media.type] : '';
  });

  readonly year = computed(() => (this.media()?.releaseDate || '').slice(0, 4));

  readonly releaseDateLabel = computed(() => {
    const date = this.media()?.releaseDate;
    if (!date) {
      return 'Sin fecha';
    }
    const [year, month, day] = date.split('-');
    return day && month && year ? `${day}/${month}/${year}` : date;
  });

  readonly runtimeLabel = computed(() => {
    const runtime = this.media()?.runtime;
    if (!runtime) {
      return null;
    }
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  });

  readonly imageFailed = signal(false);

  ionViewWillEnter(): void {
    // Trae las reseñas más recientes de la comunidad para este título.
    void this.library.reload().catch(() => undefined);
  }

  readonly posterSrc = computed(() => {
    const path = this.media()?.posterPath;
    if (!path || this.imageFailed()) {
      return null;
    }
    return `${TMDB_IMAGE_BASE}${path}`;
  });

  readonly heroImage = computed(() => {
    const media = this.media();
    if (!media) {
      return null;
    }
    const path = media.backdropPath || media.posterPath;
    return path ? `${TMDB_BACKDROP_BASE}${path}` : null;
  });

  writeReview(): void {
    void this.router.navigate(['/reviews/new', this.mediaId]);
  }

  editReview(review: Review): void {
    void this.router.navigate(['/reviews/edit', review.id]);
  }

  async removeReview(review: Review): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar reseña',
      message: '¿Seguro que quieres eliminar tu reseña?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.reviewService.remove(review.id);
          }
        }
      ]
    });
    await alert.present();
  }

  onReviewFilterChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string }>).detail?.value;
    if (value === 'all' || value === 'user' || value === 'critic') {
      this.reviewFilter.set(value);
    }
  }

  initials(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?'
    );
  }

  goBack(): void {
    void this.router.navigateByUrl('/tabs/explore');
  }

  private topReview(role: 'user' | 'critic'): Review | undefined {
    return [...this.reviews()]
      .filter((review) => review.authorRole === role)
      .sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt))[0];
  }
}
