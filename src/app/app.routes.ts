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
    redirectTo: 'office/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'office/dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/office/office-dashboard/office-dashboard').then(
        m => m.OfficeDashboard
      ),
  },
  {
    path: 'office/companies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/companies/companies').then(m => m.CompaniesComponent),
  },
  {
    path: 'office/office-users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/office-users/office-users').then(m => m.OfficeUsers),
  },
  {
    path: 'office/accounts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/accounts/accounts').then(m => m.Accounts),
  },
  {
    path: 'office/journal-entries',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/journal-entries/journal-entries').then(
        m => m.JournalEntries
      ),
  },
  {
    path: 'office/configuration',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/configuration/configuration').then(m => m.Configuration),
  },

  /* ======================================================
     FALLBACK
  ====================================================== */
  {
    path: '**',
    redirectTo: 'login',
  },
];