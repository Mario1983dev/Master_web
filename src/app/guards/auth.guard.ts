import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthMaster } from '../services/auth-master';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthMaster);

  const token = auth.getToken();
  const user = auth.getUser();

  if (!token || !user) {
    return router.createUrlTree(['/login']);
  }

  const url = state.url;

  const scope = String(user?.scope || '').trim().toLowerCase();
  const role = String(user?.role || '').trim().toUpperCase();

  const isMaster = scope === 'master' || role === 'MASTER';
  const isOfficeAdmin =
    scope === 'office_admin' || role === 'OFFICE_ADMIN';
  const isOfficeUser =
    scope === 'office_user' || role === 'OFFICE_USER';
  const isOffice = isOfficeAdmin || isOfficeUser;

  // =========================
  // RUTAS MASTER
  // =========================
  if (url.startsWith('/master')) {
    if (isMaster) {
      return true;
    }

    return router.createUrlTree(['/login']);
  }

  // =========================
  // RUTAS OFFICE SOLO ADMIN
  // =========================
  if (
    url.startsWith('/office/companies') ||
    url.startsWith('/office/office-users')
  ) {
    if (isOfficeAdmin) {
      return true;
    }

    return router.createUrlTree(['/office']);
  }

  // =========================
  // RUTAS OFFICE GENERALES
  // =========================
  if (url.startsWith('/office')) {
    if (isOffice) {
      return true;
    }

    return router.createUrlTree(['/login']);
  }

  return true;
};