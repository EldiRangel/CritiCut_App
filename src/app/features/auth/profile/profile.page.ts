import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular';

import {
  EMAIL_REGEX,
  LIMITS,
  NO_SPACES_REGEX,
  ROLE_LABELS,
  TMDB_IMAGE_BASE,
  TYPE_LABELS
} from '@core/constants/app.constants';
import type { MediaType } from '@core/models/media.model';
import type { Review } from '@core/models/review.model';
import { AuthService } from '@core/services/auth.service';
import { MediaService } from '@core/services/media.service';
import { ReviewService } from '@core/services/review.service';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    TimeAgoPipe
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly mediaService = inject(MediaService);
  private readonly reviewsService = inject(ReviewService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);

  readonly limits = LIMITS;
  readonly user = this.auth.currentUser;

  readonly roleLabel = computed(() => {
    const user = this.user();
    return user ? ROLE_LABELS[user.role] : '';
  });

  readonly roleIcon = computed(() =>
    this.user()?.role === 'critic'
      ? 'assets/icons/knife.svg'
      : 'assets/icons/popcorn.svg'
  );

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

  readonly myReviews = computed(() => {
    const user = this.user();
    return user ? this.reviewsService.getByUser(user.id) : [];
  });

  readonly reviewCount = computed(() => this.myReviews().length);

  readonly uniqueTitles = computed(
    () => new Set(this.myReviews().map((review) => review.mediaId)).size
  );

  readonly averageGiven = computed(() => {
    const reviews = this.myReviews();
    if (reviews.length === 0) {
      return 0;
    }
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  });

  readonly myReviewItems = computed(() =>
    this.myReviews().map((review) => ({
      review,
      media: this.mediaService.getById(review.mediaId)
    }))
  );

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.pattern(NO_SPACES_REGEX),
        Validators.minLength(LIMITS.nameMin),
        Validators.maxLength(LIMITS.nameMax)
      ]
    ],
    email: [
      '',
      [Validators.required, Validators.pattern(EMAIL_REGEX), Validators.maxLength(LIMITS.emailMax)]
    ]
  });

  readonly saving = signal(false);
  readonly message = signal<{ type: 'ok' | 'error'; text: string } | null>(null);

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({ name: user.name, email: user.email });
    }
  }

  ionViewWillEnter(): void {
    // Mantiene al día las reseñas propias guardadas en la nube.
    void this.reviewsService.loadMine().catch(() => undefined);
  }

  posterUrl(path: string | null | undefined): string | null {
    return path ? `${TMDB_IMAGE_BASE}${path}` : null;
  }

  typeLabel(type: MediaType): string {
    return TYPE_LABELS[type];
  }

  yearFor(date: string | undefined): string {
    return (date || '').slice(0, 4);
  }

  openMedia(id: string): void {
    void this.router.navigate(['/media', id]);
  }

  goExplore(): void {
    void this.router.navigateByUrl('/tabs/explore');
  }

  editReview(review: Review): void {
    void this.router.navigate(['/reviews/edit', review.id]);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.message.set(null);
    const { name, email } = this.form.getRawValue();
    const result = await this.auth.updateProfile({ name, email });
    this.saving.set(false);
    if (!result.ok) {
      this.message.set({
        type: 'error',
        text: result.error ?? 'No se pudo guardar el perfil.'
      });
      return;
    }
    this.message.set({ type: 'ok', text: 'Perfil actualizado correctamente.' });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async confirmDelete(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar mi cuenta',
      message: 'Se borrarán tu cuenta y todas tus reseñas. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.deleteAccount();
          }
        }
      ]
    });
    await alert.present();
  }

  private async deleteAccount(): Promise<void> {
    await this.auth.deleteAccount();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
