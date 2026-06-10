import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { offlineInterceptor } from './offline.interceptor';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { NetworkStatusService } from './services/network-status.service';
import { SwUpdateService } from './services/sw-update.service';

function initializeNetworkStatus(): () => void {
  return () => {
    // El servicio se instancia automáticamente al inyectarse.
    // Solo necesitamos que Angular lo cree al arrancar.
    inject(NetworkStatusService);
  };
}

function initializeSwUpdate(): () => void {
  return () => {
    const swUpdate = inject(SwUpdateService);
    swUpdate.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([offlineInterceptor, authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeNetworkStatus,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSwUpdate,
      multi: true,
    },
  ],
};
