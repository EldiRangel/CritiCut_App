import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular';

import { LIMITS, TMDB_IMAGE_BASE, TYPE_LABELS } from '@core/constants/app.constants';
import {
  ExternalApiService,
  type TmdbMediaResult
} from '@core/services/external-api.service';
import { AuthService } from '@core/services/auth.service';
import { LibraryService } from '@core/services/library.service';
import { MediaService } from '@core/services/media.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-media-import',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonSpinner,
    EmptyStateComponent
  ],
  templateUrl: './media-import.page.html',
  styleUrls: ['./media-import.page.scss']
})
export class MediaImportPage {
  private readonly api = inject(ExternalApiService);
  private readonly mediaService = inject(MediaService);
  private readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly hasApiKey = this.api.hasApiKey;
  readonly query = signal('');
  readonly results = signal<TmdbMediaResult[]>([]);
  readonly searching = signal(false);
  readonly error = signal('');
  readonly searched = signal(false);
  readonly addingId = signal<string | null>(null);

  readonly suggestions = [
    'Dune',
    'Oppenheimer',
    'The Last of Us',
    'Breaking Bad',
    'Interstellar',
    'Arcane'
  ];

  readonly skeletons = [1, 2, 3];

  async search(): Promise<void> {
    const term = this.query().trim();
    if (term.length < LIMITS.searchMin) {
      this.error.set(`Escribe al menos ${LIMITS.searchMin} caracteres.`);
      return;
    }
    this.searching.set(true);
    this.error.set('');
    this.searched.set(true);
    try {
      this.results.set(await this.api.search(term));
    } catch (error) {
      this.results.set([]);
      this.error.set(error instanceof Error ? error.message : 'No se pudo consultar TMDB.');
    } finally {
      this.searching.set(false);
    }
  }

  quickSearch(term: string): void {
    this.query.set(term);
    void this.search();
  }

  onSearchInput(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | null }>).detail?.value ?? '';
    this.query.set(value);
  }

  resultTitle(result: TmdbMediaResult): string {
    return result.title ?? result.name ?? 'Sin título';
  }

  resultYear(result: TmdbMediaResult): string {
    return (result.release_date || result.first_air_date || '').slice(0, 4);
  }

  posterUrl(result: TmdbMediaResult): string | null {
    return result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : null;
  }

  typeLabel(result: TmdbMediaResult): string {
    return TYPE_LABELS[result.media_type];
  }

  localIdFor(result: TmdbMediaResult): string | undefined {
    const user = this.auth.currentUser();
    const mediaId = this.mediaService.findByTmdb(result.id, result.media_type)?.id;
    if (!user || !mediaId || !this.library.has(user.id, mediaId)) {
      return undefined;
    }
    return mediaId;
  }

  isAdding(result: TmdbMediaResult): boolean {
    return this.addingId() === `${result.media_type}-${result.id}`;
  }

  async add(result: TmdbMediaResult): Promise<void> {
    if (this.localIdFor(result)) {
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.addingId.set(`${result.media_type}-${result.id}`);
    try {
      const details = await this.api.getDetails(result.media_type, result.id);
      const media = await this.library.addMedia(
        this.api.toMedia(details, result.media_type)
      );
      await this.presentToast(`"${media.title}" se guardó en tu colección.`);
    } catch (error) {
      await this.presentToast(
        error instanceof Error ? error.message : 'No se pudo agregar el título.',
        'danger'
      );
    } finally {
      this.addingId.set(null);
    }
  }

  openLocal(result: TmdbMediaResult): void {
    const id = this.localIdFor(result);
    if (id) {
      void this.router.navigate(['/media', id]);
    }
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2600,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
