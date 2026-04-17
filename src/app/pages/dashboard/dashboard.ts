import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/button/button';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { ChangePasswordModalComponent } from '../../shared/change-password-modal/change-password-modal';

@Component({
  selector: 'app-dashboard',
  imports: [ButtonComponent, RouterLink, SidebarComponent, ChangePasswordModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex">
      <!-- Sidebar -->
      <app-sidebar [isMobile]="false" />

      <!-- Main content -->
      <div class="flex-1 flex flex-col">
        <!-- Top bar -->
        <header
          class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center justify-between px-6"
        >
          <!-- Mobile menu button -->
          <button
            class="lg:hidden text-gray-400 hover:text-white p-2"
            (click)="toggleMobileSidebar()"
            aria-label="Abrir menú"
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
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h2 class="text-lg font-semibold text-white">Dashboard</h2>

          <div class="flex items-center gap-4">
            <span class="hidden sm:inline text-sm text-gray-400">
              {{ userEmail() }}
            </span>
            <app-button variant="ghost" size="sm" (click)="openPasswordModal()">
              Cambiar Contraseña
            </app-button>
            <app-button variant="ghost" size="sm" (click)="logout()">
              Cerrar Sesión
            </app-button>
          </div>
        </header>

        <!-- Modals -->
        @if (isPasswordModalOpen()) {
          <app-change-password-modal (closeModal)="closePasswordModal()" />
        }

        <!-- Mobile sidebar overlay -->
        @if (mobileSidebarOpen()) {
          <div
            class="fixed inset-0 z-50 lg:hidden"
            (click)="toggleMobileSidebar()"
          >
            <div class="absolute inset-0 bg-black/60"></div>
            <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
          </div>
        }

        <!-- Page content -->
        <main class="flex-1 p-6 lg:p-8 overflow-auto">
          <!-- Welcome -->
          <div class="mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
              Bienvenido, {{ userName() }}
            </h1>
            <p class="text-gray-400">
              Panel de control — Rol:
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-700/20 text-purple-300 border border-purple-700/30"
              >
                {{ userRol() }}
              </span>
            </p>
          </div>

          <!-- Stats cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            @for (card of dashboardCards; track card.title) {
              <div
                class="glass rounded-2xl p-6 hover:border-purple-600/30 transition-all duration-300 group"
              >
                <div class="flex items-center justify-between mb-4">
                  <div
                    class="w-10 h-10 rounded-xl bg-purple-700/20 flex items-center justify-center group-hover:bg-purple-700/30 transition-colors"
                  >
                    <span class="text-lg" aria-hidden="true">{{ card.icon }}</span>
                  </div>
                </div>
                <p
                  class="text-2xl font-bold text-white mb-1"
                >
                  {{ card.value }}
                </p>
                <p class="text-sm text-gray-400">{{ card.title }}</p>
              </div>
            }
          </div>

          <!-- Quick actions -->
          <div class="glass rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">
              Acciones rápidas
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                class="flex items-center gap-3 p-4 rounded-xl bg-surface-800 border border-surface-600 hover:border-purple-700/40 hover:bg-purple-700/10 transition-all duration-300 text-left group"
                routerLink="/usuarios"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-purple-700/20 flex items-center justify-center group-hover:bg-purple-700/30 transition-colors"
                >
                  <span aria-hidden="true">👥</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">Gestionar Usuarios</p>
                  <p class="text-xs text-gray-500">Añadir o editar empleados</p>
                </div>
              </button>
              @if (userRol() === 'ADMIN') {
                <a
                  routerLink="/departamentos"
                  class="flex items-center gap-3 p-4 rounded-xl bg-surface-800 border border-surface-600 hover:border-purple-700/40 hover:bg-purple-700/10 transition-all duration-300 text-left group"
                >
                  <div
                    class="w-10 h-10 rounded-lg bg-purple-700/20 flex items-center justify-center group-hover:bg-purple-700/30 transition-colors"
                  >
                    <span aria-hidden="true">🏢</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      Crear Departamento
                    </p>
                    <p class="text-xs text-gray-500">Nueva área organizacional</p>
                  </div>
                </a>
              } @else {
                <button
                  disabled
                  class="flex items-center gap-3 p-4 rounded-xl bg-surface-800 border border-surface-600 opacity-50 cursor-not-allowed text-left group"
                >
                  <div
                    class="w-10 h-10 rounded-lg bg-purple-700/20 flex items-center justify-center"
                  >
                    <span aria-hidden="true">🏢</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      Crear Departamento
                    </p>
                    <p class="text-xs text-gray-500">Requiere permisos de Admin</p>
                  </div>
                </button>
              }
              <a
                routerLink="/designer"
                class="flex items-center gap-3 p-4 rounded-xl bg-surface-800 border border-surface-600 hover:border-purple-700/40 hover:bg-purple-700/10 transition-all duration-300 text-left group"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors"
                >
                  <span aria-hidden="true">🧠</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">
                    Diseñador (IA+Colaborativo)
                  </p>
                  <p class="text-xs text-gray-500">Crear flujo con IA y WebSockets</p>
                </div>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class DashboardPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly mobileSidebarOpen = signal(false);
  protected readonly isPasswordModalOpen = signal(false);

  private readonly user = signal<AuthResponse | null>(null);

  protected readonly userName = computed(
    () => this.user()?.nombre ?? 'Usuario'
  );
  protected readonly userEmail = computed(
    () => this.user()?.email ?? ''
  );
  protected readonly userRol = computed(
    () => this.user()?.rol ?? ''
  );
  protected readonly userInitials = computed(() => {
    const name = this.user()?.nombre ?? '';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  protected readonly dashboardCards = [
    { icon: '📋', value: '0', title: 'Trámites activos' },
    { icon: '👥', value: '0', title: 'Usuarios' },
    { icon: '🏢', value: '0', title: 'Departamentos' },
    { icon: '⚡', value: '0', title: 'Workflows' },
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.user.set(this.authService.getUser());
    }
  }

  protected toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((v) => !v);
  }

  protected openPasswordModal(): void {
    this.isPasswordModalOpen.set(true);
  }

  protected closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
