import { ChangeDetectionStrategy, Component, ElementRef, effect, input, OnDestroy, viewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DepartamentoMetrica } from '../../../services/analytics.service';

@Component({
  selector: 'app-analytics-department-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="glass rounded-2xl p-5 border border-surface-800 h-full">
      <h3 class="text-base font-semibold text-white mb-3">Tiempos Promedio Por Departamento</h3>
      <p class="text-xs text-gray-400 mb-4">Barras en horas promedio por etapa procesada.</p>
      <div class="h-72">
        <canvas #chartCanvas aria-label="Grafico de tiempos por departamento" role="img"></canvas>
      </div>
    </section>
  `
})
export class AnalyticsDepartmentChartComponent implements OnDestroy {
  readonly metricas = input<DepartamentoMetrica[]>([]);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const data = this.metricas();
      const canvasRef = this.chartCanvas();
      if (!canvasRef) {
        return;
      }
      this.renderChart(canvasRef.nativeElement, data);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(canvas: HTMLCanvasElement, metricas: DepartamentoMetrica[]): void {
    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: metricas.map((m) => m.departamentoNombre),
        datasets: [
          {
            label: 'Horas promedio',
            data: metricas.map((m) => m.promedioHoras),
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: 'rgba(249, 115, 22, 0.45)',
            borderColor: 'rgba(251, 146, 60, 0.9)'
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
            ticks: { color: '#CBD5E1' },
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
