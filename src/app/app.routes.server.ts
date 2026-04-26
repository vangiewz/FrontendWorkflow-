import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Configuración de renderizado SSR por ruta.
 *
 * MOTIVO: Todas las rutas con datos usan RenderMode.Client para que:
 * 1. El browser ejecute Angular completamente en cliente.
 * 2. Las peticiones HTTP las haga el browser (no el servidor Node.js).
 * 3. El offlineInterceptor pueda usar localStorage como caché offline.
 *
 * Si usáramos Prerender/Server en estas rutas, el servidor Node.js haría
 * las peticiones HTTP sin acceso a localStorage, rompiendo el modo offline.
 */
export const serverRoutes: ServerRoute[] = [
  // Páginas estáticas sin datos → se pueden prerrenderizar
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },

  // Todas las rutas con datos → renderizado en cliente
  { path: 'dashboard',                     renderMode: RenderMode.Client },
  { path: 'tramites',                      renderMode: RenderMode.Client },
  { path: 'tramites/:id',                  renderMode: RenderMode.Client },
  { path: 'workflows',                     renderMode: RenderMode.Client },
  { path: 'designer',                      renderMode: RenderMode.Client },
  { path: 'designer/:id',                  renderMode: RenderMode.Client },
  { path: 'usuarios',                      renderMode: RenderMode.Client },
  { path: 'usuarios/crear',               renderMode: RenderMode.Client },
  { path: 'clientes',                      renderMode: RenderMode.Client },
  { path: 'departamentos',                 renderMode: RenderMode.Client },
  { path: 'bitacora',                      renderMode: RenderMode.Client },
  { path: 'analytics',                     renderMode: RenderMode.Client },
  { path: 'paquetes/admin-organizacional', renderMode: RenderMode.Client },
  { path: 'paquetes/configuracion-ia',     renderMode: RenderMode.Client },
  { path: 'paquetes/operacion-tramites',   renderMode: RenderMode.Client },
  { path: 'paquetes/seguridad-acceso',     renderMode: RenderMode.Client },

  // Catch-all → cliente
  { path: '**', renderMode: RenderMode.Client }
];
