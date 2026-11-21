import { Pipe, PipeTransform } from '@angular/core';

/** Muestra un promedio con un decimal o un guion si no hay reseñas. */
@Pipe({
  name: 'averageRating',
  standalone: true
})
export class AverageRatingPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (!value || value <= 0) {
      return '—';
    }
    return value.toFixed(1);
  }
}
