import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';

import { ROLE_LABELS } from '@core/constants/app.constants';
import type { Review } from '@core/models/review.model';
import type { UserRole } from '@core/models/user.model';

import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [IonIcon, TimeAgoPipe],
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss']
})
export class ReviewListComponent {
  readonly reviews = input<Review[]>([]);
  readonly currentUserId = input<string | null>(null);
  readonly edit = output<Review>();
  readonly remove = output<Review>();

  roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  isEdited(review: Review): boolean {
    return new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60000;
  }

  scoreClass(rating: number): string {
    if (rating >= 8) {
      return 'high';
    }
    if (rating >= 6) {
      return 'mid';
    }
    return 'low';
  }
}
