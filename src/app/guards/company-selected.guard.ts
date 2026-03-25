import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthMaster } from '../services/auth-master';

export const companySelectedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthMaster);

  const companyId = auth.getSelectedCompanyId();

  if (!companyId) {
    return router.createUrlTree(['/office']);
  }

  return true;
};