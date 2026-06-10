import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InsightAlerta } from '../../../services/analytics.service';

@Component({
  selector: 'app-analytics-alert-panel',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="glass rounded-2xl p-5 border border-surface-800">
      <header class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold text-white">Alertas de IA</h3>
        <span class="text-xs text-gray-400">{{ insights().length }} hallazgos</span>
      </header>

      @if (insights().length === 0) {
        <p class="text-sm text-gray-400">No hay alertas activas para el rango analizado.</p>
      } @else {
        <div class="space-y-3">
          @for (insight of insights(); track insight.titulo + insight.descripcion) {
            <article
              class="rounded-xl border p-4"
              [class.border-red-500/40]="insight.severidad === 'CRITICO'"
              [class.bg-red-500/10]="insight.severidad === 'CRITICO'"
              [class.border-amber-400/40]="insight.severidad === 'ADVERTENCIA'"
              [class.bg-amber-400/10]="insight.severidad === 'ADVERTENCIA'"
              [class.border-sky-400/30]="insight.severidad === 'INFO'"
              [class.bg-sky-400/10]="insight.severidad === 'INFO'"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <h4 class="text-sm font-semibold text-white">{{ insight.titulo }}</h4>
                <span
                  class="text-[11px] font-bold px-2 py-1 rounded-full"
                  [class.text-red-200]="insight.severidad === 'CRITICO'"
                  [class.bg-red-500/25]="insight.severidad === 'CRITICO'"
                  [class.text-amber-100]="insight.severidad === 'ADVERTENCIA'"
                  [class.bg-amber-500/20]="insight.severidad === 'ADVERTENCIA'"
                  [class.text-sky-100]="insight.severidad === 'INFO'"
                  [class.bg-sky-500/20]="insight.severidad === 'INFO'"
                >
                  {{ insight.severidad }}
                </span>
              </div>

              <p class="text-sm text-gray-200 leading-relaxed mb-3">{{ insight.descripcion }}</p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div class="rounded-lg bg-black/20 px-3 py-2 text-gray-300">
                  <strong class="text-gray-100">Departamento:</strong>
                  {{ insight.departamentoId ?? 'N/A' }}
                </div>
                <div class="rounded-lg bg-black/20 px-3 py-2 text-gray-300">
                  <strong class="text-gray-100">Funcionario:</strong>
                  {{ insight.funcionarioId ?? 'N/A' }}
                </div>
                <div class="rounded-lg bg-black/20 px-3 py-2 text-gray-300">
                  <strong class="text-gray-100">Retraso:</strong>
                  {{ insight.retrasoHoras ?? 0 | number: '1.0-1' }}h
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `
})
export class AnalyticsAlertPanelComponent {
  readonly insights = input<InsightAlerta[]>([]);
}
