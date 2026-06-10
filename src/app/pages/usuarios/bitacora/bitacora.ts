import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { ButtonComponent } from '../../../shared/button/button';
import { Bitacora, BitacoraService } from '../../../services/bitacora.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-950">
      <!-- Sidebar Desktop -->
      <app-sidebar [isMobile]="false" />

      <!-- Sidebar Mobile Overlay -->
      @if (isMobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="toggleMobileMenu()"></div>
        <div class="lg:hidden fixed inset-y-0 left-0 z-50 w-64 shadow-2xl">
          <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileMenu()" />
        </div>
      }

      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-10">
          <div class="flex items-center gap-3">
            <button 
              (click)="toggleMobileMenu()"
              class="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <h1 class="text-base sm:text-lg font-semibold text-white tracking-tight truncate">Bitácora del Sistema</h1>
          </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 p-4 lg:p-8 overflow-y-auto">
          <!-- Controls (Search) -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="relative flex-1">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Buscar por usuario, acción o detalles..."
                class="block w-full pl-10 pr-3 py-2 border border-surface-700 rounded-xl leading-5 bg-surface-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              />
            </div>
            <app-button variant="outline" size="sm" (click)="loadBitacora()">
               <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
               Refrescar
            </app-button>
          </div>

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg class="w-8 h-8 animate-spin mb-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <p class="text-sm">Cargando registros...</p>
            </div>
          }

          <!-- Empty State -->
          @if (!isLoading() && filteredLogs().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 bg-surface-900/50 rounded-2xl border border-surface-800 border-dashed">
              <svg class="w-12 h-12 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-gray-400 text-sm">No se encontraron registros de auditoría</p>
            </div>
          }

          <!-- Bitacora Table/List -->
          @if (!isLoading() && filteredLogs().length > 0) {
            <div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-sm">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-surface-800/50 border-b border-surface-700">
                      <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Fecha y Hora</th>
                      <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Acción</th>
                      <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Usuario</th>
                      <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Rol</th>
                      <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[300px]">Detalles</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-surface-800">
                    @for (log of filteredLogs(); track log.id) {
                      <tr class="hover:bg-surface-800/50 transition-colors">
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class="text-sm text-gray-300">{{ formatDate(log.fechaHora) }}</span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            [ngClass]="getBadgeClasses(log.accion)">
                            {{ log.accion }}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <div class="flex flex-col">
                            <span class="text-sm font-medium text-white">{{ log.usuarioNombre }}</span>
                            <span class="text-xs text-gray-500">{{ log.usuarioEmail }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class="text-xs text-gray-400">{{ log.rol }}</span>
                        </td>
                        <td class="px-4 py-3">
                          <p class="text-sm text-gray-300 break-words">{{ log.detalles }}</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `
})
export class BitacoraComponent implements OnInit {
  private readonly bitacoraService = inject(BitacoraService);

  isMobileMenuOpen = signal(false);
  isLoading = signal(true);
  logs = signal<Bitacora[]>([]);
  searchQuery = signal('');

  filteredLogs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.logs();
    
    return this.logs().filter(log => 
      log.usuarioNombre.toLowerCase().includes(q) ||
      log.usuarioEmail.toLowerCase().includes(q) ||
      log.accion.toLowerCase().includes(q) ||
      log.detalles.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadBitacora();
  }

  loadBitacora() {
    this.isLoading.set(true);
    this.bitacoraService.getBitacora().subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando bitácora', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(d);
  }

  getBadgeClasses(accion: string): string {
    const act = accion.toUpperCase();
    if (act.includes('LOGIN')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (act.includes('PASSWORD')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (act.includes('CREACION') || act.includes('REGISTRO')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (act.includes('DESACTIVACION')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (act.includes('TRAMITE_INICIADO')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (act.includes('TRAMITE_FINALIZADO')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}
