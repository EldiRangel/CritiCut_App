import { Component, computed, input } from '@angular/core';

export type ScoreKind = 'critic' | 'audience';
export type ScoreSize = 'sm' | 'md' | 'lg';

/**
 * Puntaje estilo Rotten Tomatoes, adaptado a CritiCut.
 * Críticos: cuchillo afilado o mellado. Audiencia: palomitas.
 * El puntaje interno es de 0 a 10 y se muestra como porcentaje.
 */
@Component({
  selector: 'app-score-badge',
  standalone: true,
  templateUrl: './score-badge.component.html',
  styleUrls: ['./score-badge.component.scss']
})
export class ScoreBadgeComponent {
  readonly score = input(0);
  readonly kind = input<ScoreKind>('critic');
  readonly size = input<ScoreSize>('sm');
  readonly showLabel = input(false);
  readonly label = input<string | null>(null);

  readonly percent = computed(() => Math.round(Math.max(0, Math.min(10, this.score())) * 10));
  readonly hasScore = computed(() => this.score() > 0);
  readonly fresh = computed(() => this.percent() >= 60);

  readonly icon = computed(() => {
    if (this.kind() === 'audience') {
      return 'assets/icons/popcorn.svg';
    }
    return this.fresh() ? 'assets/icons/knife.svg' : 'assets/icons/knife-dull.svg';
  });

  readonly defaultLabel = computed(() =>
    this.kind() === 'critic' ? 'Criticómetro' : 'Audiencia'
  );
}
