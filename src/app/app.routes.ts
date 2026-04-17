import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'departamentos',
    loadComponent: () =>
      import('./pages/departamentos/departamentos').then((m) => m.DepartamentosPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'designer',
    loadComponent: () =>
      import('./pages/workflow-designer/workflow-designer').then((m) => m.WorkflowDesignerPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./pages/usuarios/gestionar-usuarios/gestionar-usuarios').then((m) => m.GestionarUsuariosPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'usuarios/crear',
    loadComponent: () =>
      import('./pages/usuarios/crear-usuario/crear-usuario').then((m) => m.CrearUsuarioPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
];
