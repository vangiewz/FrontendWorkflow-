import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="flex flex-col bg-surface-900 border-r border-purple-900/20 h-screen sticky top-0"
      [ngClass]="{
        'hidden lg:flex w-64': !isMobile(),
        'relative w-64 animate-slide-in-left': isMobile()
      }"
      (click)="$event.stopPropagation()"
    >
      <!-- Logo -->
      <div class="p-6 border-b border-purple-900/20 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3 group" (click)="onItemClick()">
          <div
            class="w-9 h-9 rounded-lg bg-purple-700 flex items-center justify-center shadow-lg shadow-purple-700/40"
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
          <span class="text-sm font-bold text-white tracking-tight"
            >Workflows Inteligentes</span
          >
        </a>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Menú principal">
        <a
          routerLink="/dashboard"
          (click)="onItemClick()"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          [routerLinkActiveOptions]="{exact: true}"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Inicio
        </a>
        <a
          routerLink="/paquetes/admin-organizacional"
          (click)="onItemClick()"
          [class.hidden]="userRol() !== 'ADMIN'"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="14" width="18" height="8" rx="2" ry="2"/><rect x="3" y="2" width="18" height="8" rx="2" ry="2"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="16" y1="18" x2="16" y2="18"/></svg>
          Adm. Organizacional
        </a>
        <a
          routerLink="/paquetes/configuracion-ia"
          (click)="onItemClick()"
            [class.hidden]="userRol() !== 'ADMIN'"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
          Config. e Inteligencia IA
        </a>
        <a
          routerLink="/paquetes/operacion-tramites"
          (click)="onItemClick()"
          [class.hidden]="userRol() === 'CLIENTE'"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Gestión de Trámites
        </a>
        <a
          routerLink="/paquetes/seguridad-acceso"
          (click)="onItemClick()"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Seguridad y Control
        </a>
      </nav>

      <!-- User info bottom -->
      <div class="p-4 border-t border-purple-900/20">
        <div class="flex items-center gap-3 px-3">
          <div
            class="w-9 h-9 rounded-full bg-purple-700/30 flex items-center justify-center text-purple-300 font-semibold text-sm shrink-0"
          >
            {{ userInitials() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">
              {{ userName() }}
            </p>
            <p class="text-xs text-gray-500 truncate">{{ userRol() }}</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  isMobile = input(false);
  closeSidebar = output<void>();

  private readonly user = computed(() => this.authService.getUser());

  protected readonly userName = computed(() => this.user()?.nombre ?? 'Usuario');
  protected readonly userRol = computed(() => this.user()?.rol ?? '');
  protected readonly userInitials = computed(() => {
    const name = this.user()?.nombre ?? '';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  onItemClick() {
    if (this.isMobile()) {
      this.closeSidebar.emit();
    }
  }
}
