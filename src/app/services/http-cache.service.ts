import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface CacheEntry {
  data: any;
  timestamp: number;
  url: string;
}

const CACHE_PREFIX = 'wf_http_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max por entrada

/**
 * Servicio de caché HTTP local.
 * Almacena respuestas de peticiones GET en localStorage para que
 * estén disponibles cuando no hay conexión a Internet.
 * Funciona tanto en modo desarrollo como en producción.
 */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private readonly platformId = inject(PLATFORM_ID);
  private memoryCache = new Map<string, CacheEntry>();

  /** Guarda una respuesta en caché (localStorage + memoria) */
  set(url: string, data: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const entry: CacheEntry = { data, timestamp: Date.now(), url };

    // Siempre guardar en memoria
    this.memoryCache.set(url, entry);

    // Intentar guardar en localStorage (puede fallar por cuota)
    try {
      const serialized = JSON.stringify(entry);
      if (serialized.length < MAX_CACHE_SIZE_BYTES) {
        localStorage.setItem(`${CACHE_PREFIX}${btoa(encodeURIComponent(url))}`, serialized);
      }
    } catch {
      // LocalStorage lleno — limpiar entradas antiguas y reintentar
      this.evictOldEntries();
      try {
        localStorage.setItem(`${CACHE_PREFIX}${btoa(encodeURIComponent(url))}`, JSON.stringify(entry));
      } catch {
        // Si sigue fallando, solo mantenemos en memoria
      }
    }
  }

  /** Obtiene una respuesta cacheada, null si no existe o expiró */
  get(url: string): any | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    // Primero buscar en memoria (más rápido)
    const memEntry = this.memoryCache.get(url);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data;
    }

    // Luego en localStorage
    try {
      const key = `${CACHE_PREFIX}${btoa(encodeURIComponent(url))}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry = JSON.parse(raw);
      if (this.isExpired(entry)) {
        localStorage.removeItem(key);
        return null;
      }

      // Restaurar en memoria también
      this.memoryCache.set(url, entry);
      return entry.data;
    } catch {
      return null;
    }
  }

  /** Comprueba si hay datos en caché para esta URL */
  has(url: string): boolean {
    return this.get(url) !== null;
  }

  /** Invalida una entrada del caché */
  invalidate(urlPattern: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Limpiar memoria
    for (const key of this.memoryCache.keys()) {
      if (key.includes(urlPattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          try {
            const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '{}');
            if (entry.url?.includes(urlPattern)) {
              keysToRemove.push(key);
            }
          } catch { /* ignorar entradas malformadas */ }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch { /* ignorar */ }
  }

  /** Limpia entradas expiradas del localStorage */
  private evictOldEntries(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          try {
            const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '{}');
            if (this.isExpired(entry)) keysToRemove.push(key);
          } catch {
            keysToRemove.push(key!);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch { /* ignorar */ }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > CACHE_EXPIRY_MS;
  }
}
