import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para verificar que el usuario tenga un rol específico.
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.getUser();

    if (user && allowedRoles.includes(user.rol)) {
      return true;
    }

    // Si no tiene el rol, re-dirigimos al dashboard o login
    router.navigate(['/dashboard']);
    return false;
  };
};
