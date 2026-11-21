import { Routes } from '@angular/router';

/** Rutas hijas que se muestran dentro de las pestañas inferiores. */
export const TABS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'explore',
    pathMatch: 'full'
  },
  {
    path: 'explore',
    loadComponent: () =>
      import('@features/media/media-list/media-list.page').then((m) => m.MediaListPage)
  },
  {
    path: 'search',
    loadComponent: () =>
      import('@features/media/media-import/media-import.page').then((m) => m.MediaImportPage)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('@features/auth/profile/profile.page').then((m) => m.ProfilePage)
  }
];
