import { Component, computed, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';

import { TMDB_IMAGE_BASE, TYPE_LABELS } from '@core/constants/app.constants';
import type { Media } from '@core/models/media.model';

import { ScoreBadgeComponent } from '../score-badge/score-badge.component';

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [IonIcon, ScoreBadgeComponent],
  templateUrl: './media-card.component.html',
  styleUrls: ['./media-card.component.scss']
})
export class MediaCardComponent {
  readonly media = input.required<Media>();
  readonly criticAverage = input(0);
  readonly audienceAverage = input(0);
  readonly count = input(0);
  readonly selected = output<string>();

  readonly imageFailed = signal(false);

  readonly posterUrl = computed(() => {
    const path = this.media().posterPath;
    return path && !this.imageFailed() ? `${TMDB_IMAGE_BASE}${path}` : null;
  });

  readonly year = computed(() => (this.media().releaseDate || '').slice(0, 4) || '—');
  readonly typeLabel = computed(() => TYPE_LABELS[this.media().type]);
  readonly genre = computed(() => this.media().genres[0] ?? 'Sin género');
  readonly reviewLabel = computed(() => {
    const count = this.count();
    if (count === 0) {
      return 'Sin reseñas todavía';
    }
    return `${count} reseña${count === 1 ? '' : 's'}`;
  });

  open(): void {
    this.selected.emit(this.media().id);
  }
}
