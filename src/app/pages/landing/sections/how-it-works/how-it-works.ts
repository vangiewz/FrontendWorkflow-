import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Step {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="how-it-works" class="relative py-24 lg:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section header -->
        <div class="text-center mb-16">
          <span
            class="text-sm font-semibold text-purple-400 uppercase tracking-wider"
            >Proceso</span
          >
          <h2
            class="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
          >
            Cómo funciona
          </h2>
          <p class="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Desde la creación hasta la aprobación, todo automatizado con IA.
          </p>
        </div>

        <!-- Timeline -->
        <div class="relative max-w-3xl mx-auto">
          <!-- Vertical line -->
          <div
            class="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-700 via-purple-500 to-purple-900/20"
            aria-hidden="true"
          ></div>

          <!-- Steps -->
          @for (step of steps; track step.number; let i = $index; let even = $even) {
            <div
              class="relative flex items-start gap-6 mb-12 last:mb-0"
              [class.md:flex-row-reverse]="!even"
            >
              <!-- Number circle -->
              <div
                class="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-700/40 md:mx-auto"
              >
                {{ step.number }}
              </div>

              <!-- Content card -->
              <div
                class="flex-1 glass rounded-xl p-6 hover:border-purple-600/30 transition-all duration-300"
                [class.md:text-right]="even"
              >
                <h3 class="text-lg font-bold text-white mb-2">
                  {{ step.title }}
                </h3>
                <p class="text-gray-400 text-sm leading-relaxed">
                  {{ step.description }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class HowItWorksComponent {
  protected readonly steps: Step[] = [
    {
      number: '1',
      title: 'Describe el trámite a la IA',
      description:
        'El administrador escribe en lenguaje natural qué flujo de trabajo necesita. La IA entiende el contexto y propone la estructura.',
    },
    {
      number: '2',
      title: 'La IA genera el flujo completo',
      description:
        'Automáticamente se crean las rutas de aprobación, los formularios dinámicos y las reglas de negocio entre departamentos.',
    },
    {
      number: '3',
      title: 'El cliente solicita el trámite',
      description:
        'Desde una aplicación móvil, el cliente llena el formulario inicial y envía su solicitud. Puede ver el progreso en tiempo real.',
    },
    {
      number: '4',
      title: 'Aprobación inteligente y automática',
      description:
        'Cada empleado aprueba su parte y el sistema avanza al siguiente paso. La IA supervisa tiempos y alerta sobre cuellos de botella.',
    },
  ];
}
