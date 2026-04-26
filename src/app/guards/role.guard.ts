import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para verificar que el usuario tenga un rol específico.
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return true; // Permitir SSR, el cliente lo verificará
    }

    const user = authService.getUser();

    if (user && allowedRoles.includes(user.rol)) {
      return true;
    }

    // Si no tiene el rol, re-dirigimos al dashboard o login
    router.navigate(['/dashboard']);
    return false;
  };
};
