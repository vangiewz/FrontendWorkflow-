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
      class="flex flex-col bg-surface-900 border-r border-purple-900/20 h-full"
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
            >Workflows</span
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </a>
        <a
          routerLink="/usuarios"
          (click)="onItemClick()"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Usuarios
        </a>
        <a
          routerLink="/departamentos"
          (click)="onItemClick()"
          [class.hidden]="userRol() !== 'ADMIN'"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          Departamentos
        </a>
        <a
          routerLink="/designer"
          (click)="onItemClick()"
          routerLinkActive="bg-purple-700/20 text-purple-300 border-purple-700/30 font-medium"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Diseñador Workflow (IA)
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
