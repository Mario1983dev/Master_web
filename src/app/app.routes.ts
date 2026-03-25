import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { companySelectedGuard } from './guards/company-selected.guard';

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

  // 🔥 EMPRESAS (solo admin)
  {
    path: 'office/companies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/companies/companies').then(m => m.CompaniesComponent),
  },

  // 🔥 USUARIOS (solo admin)
  {
    path: 'office/office-users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/office-users/office-users').then(m => m.OfficeUsers),
  },

  // 🔥 PLAN DE CUENTAS (requiere empresa seleccionada)
  {
    path: 'office/accounts',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/accounts/accounts').then(m => m.AccountsComponent),
  },

  // 🔥 ASIENTOS (requiere empresa seleccionada)
  {
    path: 'office/journal-entries',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/journal-entries/journal-entries').then(m => m.JournalEntriesComponent),
  },

  /* ======================================================
     FALLBACK
  ====================================================== */
  {
    path: '**',
    redirectTo: 'login',
  },
];