import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular';

import {
  LIMITS,
  TMDB_IMAGE_BASE,
  TYPE_LABELS
} from '@core/constants/app.constants';
import type { Review } from '@core/models/review.model';
import { AuthService } from '@core/services/auth.service';
import { LibraryService } from '@core/services/library.service';
import { MediaService } from '@core/services/media.service';
import { ReviewService } from '@core/services/review.service';
import { StarRatingComponent } from '@shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonButton,
    IonSpinner,
    StarRatingComponent
  ],
  templateUrl: './review-form.page.html',
  styleUrls: ['./review-form.page.scss']
})
export class ReviewFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly fb = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);
  private readonly mediaService = inject(MediaService);
  private readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly toastCtrl = inject(ToastController);

  readonly limits = LIMITS;
  readonly ratings = Array.from({ length: 10 }, (_, index) => index + 1);

  private readonly reviewId = this.route.snapshot.paramMap.get('id');
  private readonly mediaIdParam = this.route.snapshot.paramMap.get('mediaId') ?? '';
  private existing?: Review;

  readonly mediaId: string;
  readonly media = computed(() => {
    const user = this.auth.currentUser();
    if (!user || !this.library.has(user.id, this.mediaId)) {
      return undefined;
    }
    return this.mediaService.getById(this.mediaId);
  });
  readonly rating = signal(8);
  readonly saving = signal(false);
  readonly posterFailed = signal(false);

  readonly isCritic = computed(() => this.auth.currentUser()?.role === 'critic');

  readonly posterSrc = computed(() => {
    const path = this.media()?.posterPath;
    return path && !this.posterFailed() ? `${TMDB_IMAGE_BASE}${path}` : null;
  });

  readonly typeLabel = computed(() => {
    const media = this.media();
    return media ? TYPE_LABELS[media.type] : '';
  });

  readonly year = computed(() => (this.media()?.releaseDate || '').slice(0, 4));

  readonly scorePercent = computed(() => this.rating() * 10);
  readonly fresh = computed(() => this.rating() >= 6);

  readonly scorePercentLabel = computed(() =>
    this.isCritic()
      ? `${this.scorePercent()}% en el Criticómetro`
      : `${this.scorePercent()}% de audiencia`
  );

  readonly scoreLabel = computed(() => {
    if (this.isCritic()) {
      return this.fresh() ? 'Afilada' : 'Mellada';
    }
    return this.fresh() ? 'Caliente' : 'Fría';
  });

  readonly scoreIcon = computed(() => {
    if (!this.isCritic()) {
      return 'assets/icons/popcorn.svg';
    }
    return this.fresh() ? 'assets/icons/knife.svg' : 'assets/icons/knife-dull.svg';
  });

  readonly form = this.fb.nonNullable.group({
    comment: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITS.commentMin),
        Validators.maxLength(LIMITS.commentMax)
      ]
    ]
  });

  constructor() {
    if (this.reviewId) {
      const review = this.reviewService.getById(this.reviewId);
      this.existing = review;
      if (review) {
        this.mediaId = review.mediaId;
        this.rating.set(review.rating);
        this.form.patchValue({ comment: review.comment });
      } else {
        this.mediaId = '';
        void this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });
      }
      return;
    }

    this.mediaId = this.mediaIdParam;
    const user = this.auth.currentUser();
    const existing = user
      ? this.reviewService.getByMediaAndUser(this.mediaId, user.id)
      : undefined;
    if (existing) {
      this.existing = existing;
      this.rating.set(existing.rating);
      this.form.patchValue({ comment: existing.comment });
    }
  }

  get title(): string {
    return this.existing ? 'Editar reseña' : 'Escribir reseña';
  }

  setRating(value: number): void {
    const clamped = Math.min(LIMITS.ratingMax, Math.max(LIMITS.ratingMin, value));
    this.rating.set(clamped);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }
    if (!this.mediaId) {
      return;
    }
    if (!this.library.has(user.id, this.mediaId)) {
      await this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });
      return;
    }
    this.saving.set(true);
    const comment = this.form.controls.comment.value.trim();
    try {
      if (this.existing) {
        await this.reviewService.update(this.existing.id, {
          rating: this.rating(),
          comment
        });
      } else {
        await this.reviewService.add({
          mediaId: this.mediaId,
          rating: this.rating(),
          comment
        });
      }
      await this.presentToast('Reseña guardada correctamente.');
      await this.router.navigate(['/media', this.mediaId], { replaceUrl: true });
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.location.back();
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }
}
