import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="features" class="relative py-24 lg:py-32">
      <!-- Background accent -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section header -->
        <div class="text-center mb-16">
          <span
            class="text-sm font-semibold text-purple-400 uppercase tracking-wider"
            >Características</span
          >
          <h2 class="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Tres roles, un solo sistema
          </h2>
          <p class="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Cada persona interactúa con la plataforma de la manera que necesita.
          </p>
        </div>

        <!-- Feature cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          @for (feature of features; track feature.title; let i = $index) {
            <article
              class="glass rounded-2xl p-8 hover:border-purple-600/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-900/20 group"
            >
              <!-- Icon -->
              <div
                class="w-14 h-14 rounded-xl bg-purple-700/20 flex items-center justify-center mb-6 group-hover:bg-purple-700/30 transition-colors duration-300"
              >
                <span class="text-2xl" role="img" [attr.aria-label]="feature.title">{{
                  feature.icon
                }}</span>
              </div>

              <!-- Content -->
              <h3
                class="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300"
              >
                {{ feature.title }}
              </h3>
              <p class="text-gray-400 leading-relaxed">
                {{ feature.description }}
              </p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class FeaturesComponent {
  protected readonly features: Feature[] = [
    {
      icon: '🧠',
      title: 'Administrador + IA',
      description:
        'Escríbele a la IA qué trámite necesitas. Ella dibuja la ruta de aprobación y genera los formularios dinámicos automáticamente, sin programar.',
    },
    {
      icon: '📱',
      title: 'Cliente en Tiempo Real',
      description:
        'Solicita trámites desde tu celular y ve exactamente en qué escritorio está. Recibe notificaciones push en cada paso del proceso.',
    },
    {
      icon: '✅',
      title: 'Empleado Eficiente',
      description:
        'Recibe el trámite en tu pantalla, llena tu parte, aprueba con un clic. El sistema lo mueve automáticamente al siguiente departamento.',
    },
  ];
}
