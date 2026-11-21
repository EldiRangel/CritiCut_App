import { Component, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  readonly icon = input('film-outline');
  readonly title = input('Nada por aquí');
  readonly message = input('No hay resultados para mostrar.');
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();
}
