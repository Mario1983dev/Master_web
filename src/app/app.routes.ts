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

  /* MASTER */
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
  path: 'master/subscriptions',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/master/subscriptions/subscriptions').then(
      m => m.Subscriptions
    ),
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

  /* OFFICE */
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
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/journal-entries/journal-entries').then(
        m => m.JournalEntries
      ),
  },
  {
    path: 'office/journal-report',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/journal-report/journal-report-page').then(
        m => m.JournalReport
      ),
  },
  {
    path: 'office/ledger-report',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/office/ledger-report/ledger-report.component').then(
        m => m.LedgerReportComponent
      ),
  },
  {
    path: 'office/trial-balance',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/office/trial-balance/trial-balance.component').then(
        m => m.TrialBalanceComponent
      ),
  },
  {
    path: 'office/configuration',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/configuration/configuration').then(m => m.Configuration),
  },
  {
    path: 'office/accounting-periods',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/accounting-periods/accounting-periods').then(
        m => m.AccountingPeriods
      ),
  },
  {
    path: 'office/sii-import',
    canActivate: [authGuard, companySelectedGuard],
    loadComponent: () =>
      import('./pages/office/sii-import/sii-import.component').then(
        m => m.SiiImportComponent
      ),
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];