import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID,
  DestroyRef,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      [class]="isScrolled() || mobileMenuOpen() ? 'glass-strong shadow-lg bg-gray-900/95 backdrop-blur-md' : 'bg-transparent'"
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      aria-label="Navegación principal"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 lg:h-20">
          
          <!-- Logo -->
          <a href="#" class="flex items-center gap-3 group shrink-0" aria-label="Inicio">
            <div
              class="w-9 h-9 rounded-lg bg-purple-700 flex items-center justify-center shadow-lg shadow-purple-700/40 group-hover:shadow-purple-600/50 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-white"
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
            <span
              class="text-lg font-bold text-white tracking-tight hidden sm:block truncate"
            >
              Workflows Inteligentes
            </span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="#features"
              class="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300"
              >Características</a
            >
            <a
              href="#how-it-works"
              class="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300"
              >Cómo Funciona</a
            >
            <a
              href="#stats"
              class="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300"
              >Resultados</a
            >
            <a routerLink="/login" class="ml-2">
              <app-button variant="primary" size="sm">
                Iniciar Sesión
              </app-button>
            </a>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center md:hidden">
            <button
              class="text-gray-300 hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-label="Abrir menú de navegación"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                @if (mobileMenuOpen()) {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Dropdown -->
      @if (mobileMenuOpen()) {
        <div class="md:hidden absolute w-full left-0 border-t border-gray-800/50 bg-gray-900/95 backdrop-blur-xl shadow-2xl animate-fade-in-up">
          <div class="px-4 pt-2 pb-6 space-y-2 sm:px-6 flex flex-col">
            <a
              href="#features"
              class="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              (click)="closeMobileMenu()"
              >Características</a
            >
            <a
              href="#how-it-works"
              class="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              (click)="closeMobileMenu()"
              >Cómo Funciona</a
            >
            <a
              href="#stats"
              class="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              (click)="closeMobileMenu()"
              >Resultados</a
            >
            <div class="pt-4 pb-2">
              <a routerLink="/login" (click)="closeMobileMenu()" class="block">
                <app-button variant="primary" size="sm" [fullWidth]="true">
                  Iniciar Sesión
                </app-button>
              </a>
            </div>
          </div>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  protected readonly isScrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Optimizamos el evento scroll corriendo fuera de la zona de Angular
      this.ngZone.runOutsideAngular(() => {
        const onScroll = () => {
          const scrolled = window.scrollY > 20;
          // Solo desencadena change detection si el estado realmente cambió
          if (this.isScrolled() !== scrolled) {
            this.ngZone.run(() => this.isScrolled.set(scrolled));
          }
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        // Limpieza fundamental para evitar memory leaks al destruir el componente
        this.destroyRef.onDestroy(() => {
          window.removeEventListener('scroll', onScroll);
        });
      });
    }
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}