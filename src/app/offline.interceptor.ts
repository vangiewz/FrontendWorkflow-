import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, of, tap, catchError, throwError } from 'rxjs';
import { OfflineQueueService } from './services/offline-queue.service';
import { HttpCacheService } from './services/http-cache.service';
import { NetworkStatusService } from './services/network-status.service';
import { ToastService } from './shared/toast/toast.service';

/** Endpoints que requieren IA — nunca funcionan offline */
const AI_ENDPOINTS = [
  '/ai/generate',
  '/ai/assist',
  '/analytics/cuellos-botella'
];

/** Métodos de escritura que se encolan */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Interceptor HTTP con caché offline.
 *
 * La detección de conectividad la hace NetworkStatusService mediante:
 *  - Eventos browser online/offline
 *  - Heartbeat activo cada 8s a google.com/generate_204
 *
 * Este interceptor SOLO:
 *  - Cuando ONLINE: guarda respuestas GET exitosas en localStorage.
 *  - Cuando OFFLINE (detectado por el servicio): sirve desde localStorage.
 *  - Cuando hay error de red: fuerza re-probe y sirve desde localStorage.
 *  - Escrituras offline: encola en IndexedDB.
 *  - Sin timeouts — la detección es proactiva, no reactiva.
 */
export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Solo actuar en el navegador
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const cache = inject(HttpCacheService);
  const networkStatus = inject(NetworkStatusService);
  const url = req.url;
  const method = req.method.toUpperCase();

  // ─── EVITAR RE-ENCOLAMIENTO DE PETICIONES REINTENTADAS ──────────────────
  if (req.headers.has('X-Skip-Offline-Interceptor')) {
    const cloned = req.clone({ headers: req.headers.delete('X-Skip-Offline-Interceptor') });
    return next(cloned);
  }

  // ─── OFFLINE: el heartbeat ya detectó que no hay internet ──────────────────
  if (networkStatus.isOffline()) {
    return handleOffline(
      req, method, url, cache,
      inject(OfflineQueueService),
      inject(ToastService)
    );
  }

  // ─── ONLINE: dejar pasar normalmente ───────────────────────────────────────
  if (method !== 'GET') {
    return next(req);
  }

  // GETs online: guardar en caché si OK; si hay error de red → caché + re-probe
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.status === 200 && event.body != null) {
        cache.set(url, event.body);
      }
    }),
    catchError((error: HttpErrorResponse | Error) => {
      const status = (error as HttpErrorResponse)?.status;
      const isNetworkError = status === 0 || status === 502 || status === 503 || status === 504;

      if (isNetworkError) {
        // Trigger probe inmediato para que el servicio actualice isOnline
        networkStatus.forceProbe();

        const cached = cache.get(url);
        if (cached !== null) {
          console.warn(`[OfflineCache] Error de red (${status}) → caché: ${url}`);
          return of(new HttpResponse({ status: 200, body: cached, url }));
        }
        // Sin caché → devolver vacío para no romper componentes
        return of(new HttpResponse({ status: 200, body: [], url }));
      }

      // 4xx → error de negocio, propagar normalmente
      return throwError(() => error);
    })
  );
};

// ─── Modo offline ─────────────────────────────────────────────────────────────

function handleOffline(
  req: any,
  method: string,
  url: string,
  cache: HttpCacheService,
  queue: OfflineQueueService,
  toast: ToastService
) {
  // IA → bloquear
  if (AI_ENDPOINTS.some(ep => url.includes(ep))) {
    toast.warning('Esta funcionalidad requiere conexión a Internet');
    return EMPTY;
  }

  // Escrituras → encolar en IndexedDB
  if (WRITE_METHODS.includes(method)) {
    if (req.body instanceof FormData) {
      toast.warning('Esta operación incluye archivos y no puede guardarse offline');
      return EMPTY;
    }

    const headers: Record<string, string> = {};
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    const ct = req.headers.get('Content-Type');
    if (ct) headers['Content-Type'] = ct;

    queue
      .enqueue(url, method as any, req.body ?? null, headers, describeRequest(url, method), req.responseType)
      .then(() => toast.info('Operación guardada — se enviará al reconectar'));

    return of(new HttpResponse({ status: 202, body: { queued: true, offline: true } }));
  }

  // Lecturas → caché local
  const cached = cache.get(url);
  if (cached !== null) {
    console.log(`[OfflineCache] Offline → caché: ${url}`);
    return of(new HttpResponse({ status: 200, body: cached, url }));
  }

  // Sin caché → respuesta vacía (no crashear)
  toast.warning('Sin conexión — no hay datos guardados para esta sección');
  return of(new HttpResponse({ status: 200, body: [], url }));
}

function describeRequest(url: string, method: string): string {
  if (url.includes('/departamentos')) return `${method} departamento`;
  if (url.includes('/usuarios')) return `${method} usuario`;
  if (url.includes('/workflows')) return `${method} workflow`;
  if (url.includes('/tramites') && url.includes('/responder')) return 'Responder paso de trámite';
  if (url.includes('/tramites')) return `${method} trámite`;
  if (url.includes('/bitacora')) return `${method} bitácora`;
  if (url.includes('/auth')) return `${method} autenticación`;
  return `${method} ${url.split('/').pop() || 'operación'}`;
}
