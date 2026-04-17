import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-navbar',
  imports: [ButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      [class]="isScrolled() ? 'glass-strong shadow-lg' : 'bg-transparent'"
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      aria-label="Navegación principal"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 lg:h-20">
          <!-- Logo -->
          <a href="#" class="flex items-center gap-3 group" aria-label="Inicio">
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
              class="text-lg font-bold text-white tracking-tight hidden sm:block"
              >Workflows Inteligentes</span
            >
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-8">
            <a
              href="#features"
              class="text-sm text-gray-400 hover:text-white transition-colors duration-300"
              >Características</a
            >
            <a
              href="#how-it-works"
              class="text-sm text-gray-400 hover:text-white transition-colors duration-300"
              >Cómo Funciona</a
            >
            <a
              href="#stats"
              class="text-sm text-gray-400 hover:text-white transition-colors duration-300"
              >Resultados</a
            >
            <a routerLink="/login">
              <app-button variant="primary" size="sm">
                Iniciar Sesión
              </app-button>
            </a>
          </div>

          <!-- Mobile menu button -->
          <button
            class="md:hidden text-gray-400 hover:text-white p-2"
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
                <path d="M6 18L18 6M6 6l12 12" />
              } @else {
                <path d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        <!-- Mobile Navigation -->
        @if (mobileMenuOpen()) {
          <div class="md:hidden glass rounded-xl p-4 mb-4 animate-fade-in-up">
            <div class="flex flex-col gap-3">
              <a
                href="#features"
                class="text-sm text-gray-400 hover:text-white transition-colors py-2"
                (click)="closeMobileMenu()"
                >Características</a
              >
              <a
                href="#how-it-works"
                class="text-sm text-gray-400 hover:text-white transition-colors py-2"
                (click)="closeMobileMenu()"
                >Cómo Funciona</a
              >
              <a
                href="#stats"
                class="text-sm text-gray-400 hover:text-white transition-colors py-2"
                (click)="closeMobileMenu()"
                >Resultados</a
              >
              <a routerLink="/login" (click)="closeMobileMenu()">
                <app-button variant="primary" size="sm" [fullWidth]="true">
                  Iniciar Sesión
                </app-button>
              </a>
            </div>
          </div>
        }
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isScrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 20);
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
