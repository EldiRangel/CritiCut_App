import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  calendarOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircle,
  chevronForwardOutline,
  compass,
  compassOutline,
  createOutline,
  eyeOffOutline,
  eyeOutline,
  filmOutline,
  keyOutline,
  lockClosedOutline,
  logOutOutline,
  mailOutline,
  optionsOutline,
  peopleOutline,
  person,
  personOutline,
  refreshOutline,
  ribbonOutline,
  search,
  searchOutline,
  shieldCheckmarkOutline,
  star,
  starHalf,
  starOutline,
  timeOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor() {
    // Ionic 9 no registra los iconos automáticamente en todos los casos:
    // se registran solo los que usa la app para evitar avisos y peso extra.
    addIcons({
      'add-circle-outline': addCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'calendar-outline': calendarOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      'checkmark-circle': checkmarkCircle,
      'chevron-forward-outline': chevronForwardOutline,
      compass,
      'compass-outline': compassOutline,
      'create-outline': createOutline,
      'eye-off-outline': eyeOffOutline,
      'eye-outline': eyeOutline,
      'film-outline': filmOutline,
      'key-outline': keyOutline,
      'lock-closed-outline': lockClosedOutline,
      'log-out-outline': logOutOutline,
      'mail-outline': mailOutline,
      'options-outline': optionsOutline,
      'people-outline': peopleOutline,
      person,
      'person-outline': personOutline,
      'refresh-outline': refreshOutline,
      'ribbon-outline': ribbonOutline,
      search,
      'search-outline': searchOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      star,
      'star-half': starHalf,
      'star-outline': starOutline,
      'time-outline': timeOutline,
      'trash-outline': trashOutline
    });
  }
}
