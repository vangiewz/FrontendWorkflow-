import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { TramiteService, TramiteDTO } from '../../../services/tramite.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-tramites-kanban',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-950">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <button class="lg:hidden text-gray-400 hover:text-white p-2" (click)="mobileSidebarOpen.set(!mobileSidebarOpen())" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <h2 class="text-lg font-semibold text-white">Bandeja de Trámites</h2>
          </div>
        </header>

        @if (mobileSidebarOpen()) {
          <div class="fixed inset-0 z-50 lg:hidden" (click)="mobileSidebarOpen.set(false)">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <app-sidebar [isMobile]="true" (closeSidebar)="mobileSidebarOpen.set(false)" />
          </div>
        }

        <main class="flex-1 p-6 overflow-auto">
          @if (isLoading()) {
            <div class="flex justify-center items-center py-20">
              <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm text-gray-400">Cargando trámites...</p>
              </div>
            </div>
          } @else {
            <!-- Kanban Board -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <!-- PENDIENTE -->
              <div class="flex flex-col">
                <div class="flex items-center gap-3 mb-4 px-1">
                  <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                  <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Pendiente</h3>
                  <span class="ml-auto text-xs text-gray-500 bg-surface-800 px-2 py-0.5 rounded-full">{{ pendientes().length }}</span>
                </div>
                <div class="flex-1 space-y-3 overflow-y-auto pr-1 pb-4" style="max-height: calc(100vh - 180px)">
                  @for (t of pendientes(); track t.id) {
                    <div (click)="irADetalle(t)" class="group glass rounded-xl p-4 cursor-pointer hover:border-amber-500/30 transition-all duration-200 border border-transparent">
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">{{ t.nombrePlantilla }}</h4>
                        <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendiente</span>
                      </div>
                      <p class="text-[11px] text-gray-500 mb-3">Creado: {{ formatDate(t.fechaCreacion) }}</p>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div class="h-full bg-amber-500/50 rounded-full" [style.width]="getProgress(t) + '%'"></div>
                        </div>
                        <span class="text-[10px] text-gray-500">{{ getProgress(t) }}%</span>
                      </div>
                    </div>
                  }
                  @if (pendientes().length === 0) {
                    <div class="text-center py-10 opacity-40"><p class="text-xs text-gray-500">Sin trámites pendientes</p></div>
                  }
                </div>
              </div>

              <!-- EN PROGRESO -->
              <div class="flex flex-col">
                <div class="flex items-center gap-3 mb-4 px-1">
                  <div class="w-3 h-3 rounded-full bg-blue-400"></div>
                  <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">En Proceso</h3>
                  <span class="ml-auto text-xs text-gray-500 bg-surface-800 px-2 py-0.5 rounded-full">{{ enProceso().length }}</span>
                </div>
                <div class="flex-1 space-y-3 overflow-y-auto pr-1 pb-4" style="max-height: calc(100vh - 180px)">
                  @for (t of enProceso(); track t.id) {
                    <div (click)="irADetalle(t)" class="group glass rounded-xl p-4 cursor-pointer hover:border-blue-500/30 transition-all duration-200 border border-transparent">
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{{ t.nombrePlantilla }}</h4>
                        <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">En Proceso</span>
                      </div>
                      <p class="text-[11px] text-gray-500 mb-3">Paso activo: {{ getPasoActualNombre(t) }}</p>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div class="h-full bg-blue-500/50 rounded-full" [style.width]="getProgress(t) + '%'"></div>
                        </div>
                        <span class="text-[10px] text-gray-500">{{ getProgress(t) }}%</span>
                      </div>
                    </div>
                  }
                  @if (enProceso().length === 0) {
                    <div class="text-center py-10 opacity-40"><p class="text-xs text-gray-500">Sin trámites en proceso</p></div>
                  }
                </div>
              </div>

              <!-- FINALIZADO -->
              <div class="flex flex-col">
                <div class="flex items-center gap-3 mb-4 px-1">
                  <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Finalizado</h3>
                  <span class="ml-auto text-xs text-gray-500 bg-surface-800 px-2 py-0.5 rounded-full">{{ finalizados().length }}</span>
                </div>
                <div class="flex-1 space-y-3 overflow-y-auto pr-1 pb-4" style="max-height: calc(100vh - 180px)">
                  @for (t of finalizados(); track t.id) {
                    <div (click)="irADetalle(t)" class="group glass rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-all duration-200 border border-transparent">
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{{ t.nombrePlantilla }}</h4>
                        <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Finalizado</span>
                      </div>
                      <p class="text-[11px] text-gray-500 mb-2">Finalizado: {{ formatDate(t.fechaFinalizacion!) }}</p>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div class="h-full bg-emerald-500 rounded-full w-full"></div>
                        </div>
                        <span class="text-[10px] text-emerald-400">100%</span>
                      </div>
                    </div>
                  }
                  @if (finalizados().length === 0) {
                    <div class="text-center py-10 opacity-40"><p class="text-xs text-gray-500">Sin trámites finalizados</p></div>
                  }
                </div>
              </div>
            </div>
          }


        </main>
      </div>
    </div>
  `
})
export class TramitesKanbanPage implements OnInit {
  private readonly tramiteService = inject(TramiteService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  tramites = signal<TramiteDTO[]>([]);
  isLoading = signal(true);
  mobileSidebarOpen = signal(false);

  pendientes = computed(() => this.tramites().filter(t => t.estadoGlobal === 'PENDIENTE'));
  enProceso = computed(() => this.tramites().filter(t => t.estadoGlobal === 'EN_PROGRESO'));
  finalizados = computed(() => this.tramites().filter(t => t.estadoGlobal === 'FINALIZADO'));

  ngOnInit() {
    this.loadTramites();
  }

  private loadTramites() {
    this.isLoading.set(true);
    this.tramiteService.getAll().subscribe({
      next: (data) => { this.tramites.set(data); this.isLoading.set(false); },
      error: () => { this.toast.error('Error cargando trámites.'); this.isLoading.set(false); }
    });
  }

  irADetalle(t: TramiteDTO) {
    this.router.navigate(['/tramites', t.id]);
  }

  getProgress(t: TramiteDTO): number {
    if (t.estadoGlobal === 'FINALIZADO') return 100;
    const totalRespuestas = Object.keys(t.respuestas || {}).length;
    // Estimate: cada respuesta es un paso completado
    if (totalRespuestas === 0) return 0;
    return Math.min(Math.round(totalRespuestas * 20), 95); // Cap at 95 until finalized
  }

  getPasoActualNombre(t: TramiteDTO): string {
    return t.pasoActualId || 'Desconocido';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  }
}
