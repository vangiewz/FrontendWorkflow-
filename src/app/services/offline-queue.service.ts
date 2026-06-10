import { Injectable, inject, signal, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../shared/toast/toast.service';
import { NetworkStatusService } from './network-status.service';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: string | null;
  headers: Record<string, string>;
  timestamp: number;
  description: string;
}

const DB_NAME = 'wf-offline-queue';
const STORE_NAME = 'pending-requests';
const DB_VERSION = 1;

/**
 * Servicio de cola offline que almacena operaciones de escritura fallidas
 * en IndexedDB y las procesa automáticamente cuando se restablece la conexión.
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly networkStatus = inject(NetworkStatusService);

  /** Número de operaciones pendientes en la cola */
  private readonly _pendingCount = signal<number>(0);
  readonly pendingCount = this._pendingCount.asReadonly();

  /** Flag para evitar procesamiento concurrente */
  private processing = false;

  private db: IDBDatabase | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.openDb().then(() => this.refreshCount());

      // Escuchar cambios reales de red a través del servicio
      effect(() => {
        if (this.networkStatus.isOnline()) {
          this.processQueue();
        }
      });
    }
  }

  /** Abre o crea la base de datos IndexedDB */
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** Encola una operación de escritura para procesar cuando haya conexión */
  async enqueue(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: any,
    headers: Record<string, string>,
    description: string
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const db = await this.openDb();
    const item: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      url,
      method,
      body: body ? JSON.stringify(body) : null,
      headers,
      timestamp: Date.now(),
      description
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add(item);
      tx.oncomplete = () => {
        this.refreshCount();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Obtiene todas las operaciones pendientes ordenadas por timestamp */
  private async getAll(): Promise<QueuedRequest[]> {
    if (!isPlatformBrowser(this.platformId)) return [];
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const items = (request.result as QueuedRequest[])
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Elimina una operación procesada de la cola */
  private async remove(id: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        this.refreshCount();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Actualiza el conteo de operaciones pendientes */
  private async refreshCount(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const db = await this.openDb();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).count();
      request.onsuccess = () => {
        this._pendingCount.set(request.result);
        resolve();
      };
      request.onerror = () => resolve();
    });
  }

  /** Procesa todas las operaciones pendientes en orden FIFO */
  async processQueue(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.processing) return;
    if (!navigator.onLine) return;

    this.processing = true;
    const items = await this.getAll();

    if (items.length === 0) {
      this.processing = false;
      return;
    }

    this.toast.info(`Procesando ${items.length} operación(es) pendiente(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        const httpHeaders = new HttpHeaders(item.headers);
        const options = { headers: httpHeaders };

        let body: any = null;
        if (item.body) {
          try {
            body = JSON.parse(item.body);
          } catch {
            body = item.body;
          }
        }

        await new Promise<void>((resolve, reject) => {
          let request$;
          switch (item.method) {
            case 'POST':
              request$ = this.http.post(item.url, body, options);
              break;
            case 'PUT':
              request$ = this.http.put(item.url, body, options);
              break;
            case 'PATCH':
              request$ = this.http.patch(item.url, body, options);
              break;
            case 'DELETE':
              request$ = this.http.delete(item.url, options);
              break;
          }

          request$.subscribe({
            next: () => resolve(),
            error: (err: any) => {
              // Si es error de red, detenemos el procesamiento
              if (!navigator.onLine || err.status === 0) {
                reject(err);
              } else {
                // Error del servidor (4xx, 5xx) — eliminamos de la cola igualmente
                resolve();
              }
            }
          });
        });

        await this.remove(item.id);
        successCount++;
      } catch {
        failCount++;
        // Si perdimos conexión durante el procesamiento, detenemos
        if (!navigator.onLine) break;
      }
    }

    if (successCount > 0) {
      this.toast.success(`${successCount} operación(es) sincronizada(s) correctamente`);
    }
    if (failCount > 0) {
      this.toast.warning(`${failCount} operación(es) no pudieron procesarse — se reintentarán`);
    }

    this.processing = false;
  }
}
