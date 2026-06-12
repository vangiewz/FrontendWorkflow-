import { Injectable, inject, signal, computed, PLATFORM_ID, NgZone, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../shared/toast/toast.service';

/**
 * Servicio de monitoreo de conectividad a Internet.
 *
 * Usa dos mecanismos en paralelo para detectar pérdida de internet:
 *
 * 1. Eventos del browser: window.online/offline (rápido para WiFi,
 *    puede ser lento para cable físico en Windows).
 *
 * 2. Heartbeat activo: hace un fetch a una URL externa cada 8s con
 *    un timeout de 3s. Si falla → sin internet. Detecta confiablemente
 *    cuando se desconecta el cable físico aunque el adaptador local siga activo.
 *
 * El interceptor HTTP consulta `isOnline` (signal) que refleja ambos mecanismos.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly toast = inject(ToastService);

  private readonly _isOnline = signal<boolean>(true);
  /** Signal reactivo que refleja el estado REAL de internet (no solo navigator.onLine) */
  readonly isOnline = this._isOnline.asReadonly();
  readonly isOffline = computed(() => !this._isOnline());

  private hasShownOfflineToast = false;
  private hasShownOnlineToast = false;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private onlineFn?: () => void;
  private offlineFn?: () => void;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Estado inicial
      this._isOnline.set(navigator.onLine);

      // Escuchar eventos del SO
      this.onlineFn = () => this.zone.run(() => this.setOnline());
      this.offlineFn = () => this.zone.run(() => this.setOffline());
      window.addEventListener('online', this.onlineFn);
      window.addEventListener('offline', this.offlineFn);

      // Heartbeat activo cada 8 segundos
      // Fuera de NgZone para no generar CD cycles innecesarios
      this.zone.runOutsideAngular(() => {
        this.heartbeatTimer = setInterval(() => this.probe(), 8000);
        // Probe inmediato al iniciar
        this.probe();
      });
    }
  }

  /**
   * Probe de conectividad real: hace fetch a Google 204 (endpoint
   * diseñado específicamente para conectividad tests, sin cuerpo,
   * siempre disponible). Usa no-cors para evitar CORS preflight.
   * Si la petición falla (cable cortado, WiFi off) → sin internet.
   */
  private async probe(): Promise<void> {
    // Si el OS ya dice offline, no hacer el probe
    if (!navigator.onLine) {
      this.zone.run(() => this.setOffline());
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000); // 3s timeout

      // ngsw-bypass=true evita que el Service Worker intercepte esta petición y devuelva un 504 falso
      const response = await fetch(`https://www.google.com/generate_204?ngsw-bypass=true&t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',   // No necesitamos leer respuesta, solo saber si conecta
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timer);

      // Si el Service Worker llega a devolver un error 50x (debería estar bypasseado, pero por si acaso)
      if (response.status >= 500) {
         throw new Error('Service Worker synthetic response or Gateway error');
      }

      this.zone.run(() => this.setOnline());
    } catch {
      // fetch falló = sin internet real
      this.zone.run(() => this.setOffline());
    }
  }

  private setOnline(): void {
    if (!this._isOnline()) {
      this._isOnline.set(true);
      this.hasShownOfflineToast = false;
      if (this.hasShownOnlineToast) {
        this.toast.success('Conexión restablecida — sincronizando datos pendientes');
      }
      this.hasShownOnlineToast = true;
    }
  }

  private setOffline(): void {
    if (this._isOnline()) {
      this._isOnline.set(false);
      this.hasShownOnlineToast = false;
    }
    if (!this.hasShownOfflineToast) {
      this.hasShownOfflineToast = true;
      this.toast.warning('Sin conexión a Internet — modo offline activado');
    }
  }

  /**
   * Forzar un probe inmediato — útil cuando el interceptor detecta
   * que una petición falló por razones de red.
   */
  forceProbe(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => this.probe());
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.onlineFn) window.removeEventListener('online', this.onlineFn);
      if (this.offlineFn) window.removeEventListener('offline', this.offlineFn);
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    }
  }
}
