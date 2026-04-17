import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ButtonComponent } from '../../../../shared/button/button';

@Component({
  selector: 'app-hero',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      <!-- Background decorations -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <!-- Large purple orb top-right -->
        <div
          class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-700/10 blur-[120px] animate-pulse-glow"
        ></div>
        <!-- Small purple orb bottom-left -->
        <div
          class="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-purple-900/15 blur-[100px] animate-pulse-glow"
          style="animation-delay: 2s"
        ></div>
        <!-- Grid pattern overlay -->
        <div
          class="absolute inset-0 opacity-[0.03]"
          style="background-image: linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px);
                 background-size: 60px 60px"
        ></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in-up"
        >
          <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          <span class="text-sm text-purple-300 font-medium"
            >Potenciado por Inteligencia Artificial</span
          >
        </div>

        <!-- Headline -->
        <h1
          class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up delay-100"
        >
          <span class="text-white">Gestión de Trámites</span>
          <br />
          <span
            class="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-700 bg-clip-text text-transparent"
            >con Inteligencia Artificial</span
          >
        </h1>

        <!-- Subtitle -->
        <p
          class="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200"
        >
          Elimina el papeleo y las demoras. Diseña flujos de aprobación con IA,
          da seguimiento en tiempo real y detecta cuellos de botella
          automáticamente.
        </p>

        <!-- CTA Buttons -->
        <div
          class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300"
        >
          <app-button variant="primary" size="lg">
            Comenzar Ahora
          </app-button>
          <app-button variant="outline" size="lg">
            Ver Demo
          </app-button>
        </div>

        <!-- Scroll indicator -->
        <div class="mt-16 animate-fade-in-up delay-500">
          <div
            class="w-6 h-10 border-2 border-purple-700/50 rounded-full mx-auto flex items-start justify-center p-1"
          >
            <div
              class="w-1.5 h-3 bg-purple-500 rounded-full animate-bounce"
            ></div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {}
