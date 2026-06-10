import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import {
  AnalyticsService,
  AnalisisCuellosBotellaResponse,
  InsightAlerta,
  PlanAccionItem,
  DepartamentoMetrica,
  TramiteTiempoCompacto
} from '../../services/analytics.service';
import { AnalyticsAlertPanelComponent } from './components/analytics-alert-panel';
import { AnalyticsDepartmentChartComponent } from './components/analytics-department-chart';
import { AnalyticsTramitesChartComponent } from './components/analytics-tramites-chart';

@Component({
  selector: 'app-analytics-page',
  imports: [
    DecimalPipe,
    SidebarComponent,
    AnalyticsAlertPanelComponent,
    AnalyticsDepartmentChartComponent,
    AnalyticsTramitesChartComponent
  ],
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
            <h2 class="text-lg font-semibold text-white">Analítica de Cuellos de Botella</h2>
          </div>
          <button class="px-3 py-2 rounded-lg text-sm bg-orange-500/20 text-orange-200 border border-orange-400/30 hover:bg-orange-500/30" (click)="recargar()">Actualizar</button>
        </header>

        @if (mobileSidebarOpen()) {
          <div class="fixed inset-0 z-50 lg:hidden" (click)="mobileSidebarOpen.set(false)">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <app-sidebar [isMobile]="true" (closeSidebar)="mobileSidebarOpen.set(false)" />
          </div>
        }

        <main class="flex-1 p-6 overflow-auto space-y-6">
          <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <article class="glass rounded-xl p-4 border border-surface-800">
              <p class="text-xs uppercase tracking-wider text-gray-400 mb-1">Trámites Analizados</p>
              <p class="text-2xl font-bold text-white">{{ logs().length }}</p>
            </article>
            <article class="glass rounded-xl p-4 border border-surface-800">
              <p class="text-xs uppercase tracking-wider text-gray-400 mb-1">Departamentos Evaluados</p>
              <p class="text-2xl font-bold text-white">{{ metricas().length }}</p>
            </article>
            <article class="glass rounded-xl p-4 border border-surface-800">
              <p class="text-xs uppercase tracking-wider text-gray-400 mb-1">Alertas Críticas</p>
              <p class="text-2xl font-bold text-red-300">{{ criticasCount() }}</p>
            </article>
            <article class="glass rounded-xl p-4 border border-surface-800">
              <p class="text-xs uppercase tracking-wider text-gray-400 mb-1">Promedio Máximo</p>
              <p class="text-2xl font-bold text-orange-300">{{ maxPromedioHoras() | number: '1.1-1' }}h</p>
            </article>
          </section>

          @if (isLoading()) {
            <section class="glass rounded-2xl p-10 border border-surface-800 text-center">
              <div class="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-sm text-gray-400">Analizando tiempos históricos con IA...</p>
            </section>
          } @else if (errorMessage()) {
            <section class="glass rounded-2xl p-5 border border-red-500/40 bg-red-500/10 text-red-100">
              <p class="font-semibold">No se pudo cargar la analítica</p>
              <p class="text-sm mt-1">{{ errorMessage() }}</p>
            </section>
          } @else {
            <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <app-analytics-department-chart [metricas]="metricas()" />
              <app-analytics-tramites-chart [logs]="logs()" />
            </section>

            <app-analytics-alert-panel [insights]="insights()" />

            <section class="glass rounded-2xl p-5 border border-surface-800">
              <h3 class="text-base font-semibold text-white mb-3">Plan de Acción Sugerido Por IA</h3>

              @if (planAccion().length === 0) {
                <p class="text-sm text-gray-400">No hay acciones recomendadas en este momento.</p>
              } @else {
                <div class="space-y-3">
                  @for (item of planAccion(); track item.accion + item.objetivo) {
                    <article class="rounded-xl border border-surface-700 bg-surface-900/40 p-4">
                      <div class="flex items-center justify-between gap-3 mb-2">
                        <p class="text-sm font-semibold text-white">{{ item.accion }}</p>
                        <span class="text-[11px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/30">{{ item.prioridad }}</span>
                      </div>
                      <p class="text-sm text-gray-300 mb-2">{{ item.objetivo }}</p>
                      <p class="text-xs text-gray-400">Plazo sugerido: {{ item.plazoHoras }}</p>
                    </article>
                  }
                </div>
              }
            </section>
          }
        </main>
      </div>
    </div>
  `
})
export class AnalyticsPage implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly mobileSidebarOpen = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly data = signal<AnalisisCuellosBotellaResponse | null>(null);

  readonly insights = computed<InsightAlerta[]>(() => this.data()?.insights ?? []);
  readonly planAccion = computed<PlanAccionItem[]>(() => this.data()?.planAccion ?? []);
  readonly metricas = computed<DepartamentoMetrica[]>(() => this.data()?.metricasDepartamentos ?? []);
  readonly logs = computed<TramiteTiempoCompacto[]>(() => this.data()?.logsCompactos ?? []);

  readonly criticasCount = computed(() => this.insights().filter((x) => x.severidad === 'CRITICO').length);
  readonly maxPromedioHoras = computed(() => {
    const first = this.metricas()[0];
    return first ? first.promedioHoras : 0;
  });

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.analyticsService.getCuellosBotella(24).subscribe({
      next: (response) => {
        this.data.set(response);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        const fallback = 'Error de comunicación con el servidor de analítica.';
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
          this.errorMessage.set(error.message || fallback);
          return;
        }
        this.errorMessage.set(fallback);
      }
    });
  }
}
