import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Interceptor del lado servidor (SSR/Node.js).
 * Captura CUALQUIER error HTTP (backend caído, sin red, MongoDB inalcanzable)
 * y devuelve una respuesta vacía para que el SSR pueda renderizar el shell
 * sin crashear. El browser-side tomará el control y cargará desde el caché.
 */
const ssrErrorFallbackInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(() => {
      // Si el body esperado es un array, devolver []
      // Si es un objeto, devolver {}
      // El browser re-cargará los datos reales desde localStorage cache
      return of(new HttpResponse({ status: 200, body: [], url: req.url }));
    })
  );
};

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Sobreescribir el HTTP client del servidor con el interceptor de fallback.
    // Esto es seguro porque en SSR las rutas son RenderMode.Client,
    // por lo que el servidor no debería hacer peticiones de datos.
    provideHttpClient(withFetch(), withInterceptors([ssrErrorFallbackInterceptor]))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
