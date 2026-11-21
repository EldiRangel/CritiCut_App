import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

import { TABS_ROUTES } from './features/tabs/tabs.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/explore',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/register/register.page').then((m) => m.RegisterPage)
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('@features/tabs/tabs.page').then((m) => m.TabsPage),
    children: TABS_ROUTES
  },
  {
    path: 'media/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/media/media-detail/media-detail.page').then((m) => m.MediaDetailPage)
  },
  {
    path: 'reviews/new/:mediaId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/reviews/review-form/review-form.page').then((m) => m.ReviewFormPage)
  },
  {
    path: 'reviews/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/reviews/review-form/review-form.page').then((m) => m.ReviewFormPage)
  },
  {
    path: '**',
    redirectTo: 'tabs/explore'
  }
];
