import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  current: ReturnType<typeof signal<number>>;
}

@Component({
  selector: 'app-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="stats"
      class="relative py-24 lg:py-32"
    >
      <!-- Background -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section header -->
        <div class="text-center mb-16">
          <span
            class="text-sm font-semibold text-purple-400 uppercase tracking-wider"
            >Resultados</span
          >
          <h2
            class="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
          >
            Impacto real en tu empresa
          </h2>
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          @for (stat of stats; track stat.label) {
            <div
              class="glass rounded-2xl p-8 text-center hover:border-purple-600/30 transition-all duration-300 group"
            >
              <div
                class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-purple-400 mb-2 group-hover:text-purple-300 transition-colors"
              >
                {{ stat.current() }}{{ stat.suffix }}
              </div>
              <div class="text-sm text-gray-400">{{ stat.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class StatsComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;
  private animated = false;

  protected readonly stats: Stat[] = [
    {
      value: 90,
      suffix: '%',
      label: 'Menos papeleo',
      current: signal(0),
    },
    {
      value: 3,
      suffix: 'x',
      label: 'Más rápido',
      current: signal(0),
    },
    {
      value: 100,
      suffix: '%',
      label: 'Trazabilidad',
      current: signal(0),
    },
    {
      value: 24,
      suffix: '/7',
      label: 'Disponibilidad',
      current: signal(0),
    },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.animated) {
            this.animated = true;
            this.animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById('stats');
    if (el) this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animateCounters(): void {
    const duration = 2000;
    const fps = 60;
    const totalFrames = (duration / 1000) * fps;

    this.stats.forEach((stat) => {
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        stat.current.set(Math.round(eased * stat.value));

        if (frame >= totalFrames) {
          stat.current.set(stat.value);
          clearInterval(interval);
        }
      }, 1000 / fps);
    });
  }
}
