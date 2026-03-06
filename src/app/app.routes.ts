import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
  },

  {
    path: 'master',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/master/master').then(m => m.Master),
  },

  {
    path: 'master/offices',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/master/offices/offices').then(m => m.Offices),
  },

  {
    path: 'master/offices/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/master/offices-new/offices-new').then(m => m.OfficesNew),
  },
  {
  path: 'master/offices/edit/:id',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/master/offices-new/offices-new').then(m => m.OfficesNew),
},

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];