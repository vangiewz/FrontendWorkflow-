import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from '../shared/toast/toast.service';

/**
 * Servicio que gestiona las actualizaciones del Service Worker.
 * Notifica al usuario cuando hay una nueva versión disponible
 * y ofrece recargar la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(ToastService);
  private readonly swUpdate = inject(SwUpdate);

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.info('Nueva versión disponible — recargando...');
        setTimeout(() => {
          document.location.reload();
        }, 2000);
      });

    // Comprobar actualizaciones cada 5 minutos
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.swUpdate.checkForUpdate().catch(() => {});
      }, 5 * 60 * 1000);
    }
  }
}
