import { Pipe, PipeTransform } from '@angular/core';

type RelativeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

/** Fecha relativa en español: "hace 2 días", "ayer", etc. */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    if (Number.isNaN(time)) {
      return '';
    }

    const seconds = Math.round((time - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
    const ranges: ReadonlyArray<[RelativeUnit, number]> = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1]
    ];

    for (const [unit, secondsInUnit] of ranges) {
      if (Math.abs(seconds) >= secondsInUnit || unit === 'second') {
        return formatter.format(Math.round(seconds / secondsInUnit), unit);
      }
    }
    return '';
  }
}
