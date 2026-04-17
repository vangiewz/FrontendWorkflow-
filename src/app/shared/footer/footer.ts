import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-purple-900/30 bg-surface-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span class="text-lg font-bold text-white"
                >Workflows Inteligentes</span
              >
            </div>
            <p class="text-sm text-gray-500 max-w-xs">
              Automatiza la gestión de trámites empresariales con Inteligencia
              Artificial.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h3 class="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Navegación
            </h3>
            <ul class="space-y-2">
              <li>
                <a
                  href="#features"
                  class="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                  >Características</a
                >
              </li>
              <li>
                <a
                  href="#how-it-works"
                  class="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                  >Cómo Funciona</a
                >
              </li>
              <li>
                <a
                  href="#stats"
                  class="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                  >Resultados</a
                >
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h3 class="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Contacto
            </h3>
            <ul class="space-y-2">
              <li class="text-sm text-gray-500">info&#64;workflows.com</li>
              <li class="text-sm text-gray-500">+1 (555) 000-0000</li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div
          class="mt-10 pt-8 border-t border-purple-900/20 text-center text-sm text-gray-600"
        >
          &copy; 2026 Workflows Inteligentes. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
