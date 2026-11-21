import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent {
  /** Puntaje de 0 a 10. */
  readonly rating = input<number>(0);
  readonly size = input<number>(16);

  /** Convierte el puntaje (0-10) en 5 estrellas con medias estrellas. */
  readonly icons = computed(() => {
    const value = Math.max(0, Math.min(10, this.rating())) / 2;
    return Array.from({ length: 5 }, (_, index) => {
      const difference = value - index;
      if (difference >= 0.75) {
        return 'star';
      }
      if (difference >= 0.25) {
        return 'star-half';
      }
      return 'star-outline';
    });
  });
}
