import { ChangeDetectionStrategy, Component, ElementRef, effect, input, OnDestroy, viewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { TramiteTiempoCompacto } from '../../../services/analytics.service';

@Component({
  selector: 'app-analytics-tramites-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="glass rounded-2xl p-5 border border-surface-800 h-full">
      <h3 class="text-base font-semibold text-white mb-3">Top Trámites Más Lentos</h3>
      <p class="text-xs text-gray-400 mb-4">Duración total (horas) de los casos finalizados con mayor tiempo.</p>
      <div class="h-72">
        <canvas #chartCanvas aria-label="Grafico top tramites" role="img"></canvas>
      </div>
    </section>
  `
})
export class AnalyticsTramitesChartComponent implements OnDestroy {
  readonly logs = input<TramiteTiempoCompacto[]>([]);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const logs = this.logs();
      const canvasRef = this.chartCanvas();
      if (!canvasRef) {
        return;
      }
      this.renderChart(canvasRef.nativeElement, logs);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(canvas: HTMLCanvasElement, logs: TramiteTiempoCompacto[]): void {
    this.chart?.destroy();

    const ordered = [...logs]
      .sort((a, b) => b.minutosTotales - a.minutosTotales)
      .slice(0, 8);

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ordered.map((item) => item.tipoTramite || item.tramiteId),
        datasets: [
          {
            label: 'Horas totales',
            data: ordered.map((item) => Math.round((item.minutosTotales / 60) * 100) / 100),
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: 'rgba(59, 130, 246, 0.45)',
            borderColor: 'rgba(96, 165, 250, 0.9)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#E5E7EB' } }
        },
        scales: {
          x: {
            ticks: {
              color: '#CBD5E1',
              maxRotation: 25,
              minRotation: 25
            },
            grid: { color: 'rgba(148, 163, 184, 0.08)' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#CBD5E1' },
            grid: { color: 'rgba(148, 163, 184, 0.08)' }
          }
        }
      }
    });
  }
}
