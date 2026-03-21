
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
  },

  /* ======================================================
     MASTER
  ====================================================== */
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
    path: 'master/office-users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/office-users/office-users').then(m => m.OfficeUsers),
  },

{
  path: 'master/companies',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/companies/companies').then(m => m.CompaniesComponent),
},

  /* ======================================================
     OFFICE
  ====================================================== */
  {
    path: 'office',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/office/office').then(m => m.Office),
  },

  /* ======================================================
     FALLBACK
  ====================================================== */
  {
    path: '**',
    redirectTo: 'login',
  },
];