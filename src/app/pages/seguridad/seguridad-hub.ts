import { Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { ChangePasswordModalComponent } from '../../shared/change-password-modal/change-password-modal';

@Component({
  selector: 'app-seguridad-hub',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ChangePasswordModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-950 font-sans">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center px-6 shrink-0 z-10 sticky top-0">
           <button class="lg:hidden text-gray-400 hover:text-white p-2 mr-4" (click)="toggleMobileSidebar()" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h2 class="text-lg font-semibold text-white tracking-wide truncate max-w-sm sm:max-w-none">Seguridad y Control de Acceso</h2>
        </header>

        <!-- Mobile sidebar overlay -->
        @if (mobileSidebarOpen()) {
           <div class="fixed inset-0 z-50 lg:hidden" (click)="toggleMobileSidebar()">
             <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
             <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
           </div>
        }

        @if (isPasswordModalOpen()) {
          <app-change-password-modal (closeModal)="closePasswordModal()" />
        }

        <main class="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div class="max-w-4xl mx-auto space-y-8">
             
             <!-- Header Section -->
             <div>
                <h1 class="text-3xl font-extrabold text-white mb-3 tracking-tight">Centro de Seguridad</h1>
                <p class="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">Configura el resguardo de tu cuenta institucional, modifica credenciales de acceso y finaliza tu sesión actual de forma segura.</p>
             </div>

             <div class="space-y-6">
                <!-- Informacion de la Cuenta -->
                <div class="glass rounded-2xl p-6 lg:p-8">
                   <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div class="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center text-3xl font-bold text-violet-300 shadow-inner shrink-0">
                         {{ userInitials() }}
                      </div>
                      <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                         <div class="sm:col-span-1">
                            <h3 class="text-xl font-bold text-white">{{ userName() }}</h3>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-700/20 text-purple-300 border border-purple-700/30 mt-2">
                              ROL: {{ userRol() }}
                            </span>
                         </div>
                         <div class="space-y-1">
                            <span class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Correo Electrónico</span>
                            <p class="text-base font-medium text-gray-300 truncate">{{ userEmail() }}</p>
                         </div>
                         <div class="space-y-1">
                            <span class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Estado</span>
                            <div class="flex items-center gap-2 mt-1">
                               <span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                               <span class="text-sm font-bold text-emerald-400">Activa y Segura</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- Acciones de Riesgo -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div class="glass rounded-2xl p-6 flex-1 flex flex-col items-center justify-center text-center gap-3 border-t-4 border-t-amber-500">
                      <div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-1">
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                      <h4 class="text-gray-200 font-bold text-lg">Credenciales</h4>
                      <p class="text-xs text-gray-500 leading-relaxed">Actualiza tu código de acceso para evitar brechas de privacidad.</p>
                      <button (click)="openPasswordModal()" class="w-full mt-2 py-2.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-600 text-sm font-medium text-white transition-colors">
                         Cambiar Contraseña
                      </button>
                   </div>
                   
                   <div class="glass rounded-2xl p-6 flex-1 flex flex-col items-center justify-center text-center gap-3 border-t-4 border-t-red-500">
                      <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-1">
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      </div>
                      <h4 class="text-gray-200 font-bold text-lg">Salida Segura</h4>
                      <p class="text-xs text-gray-500 leading-relaxed">Destruye tu token JWT y cierra la sesión de forma segura.</p>
                      <button (click)="logout()" class="w-full mt-2 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-sm font-bold text-red-400 transition-colors">
                         Cerrar Sesión
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class SeguridadHubPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  mobileSidebarOpen = signal(false);
  isPasswordModalOpen = signal(false);
  
  user = signal<AuthResponse | null>(null);

  userName = computed(() => this.user()?.nombre ?? 'Usuario');
  userEmail = computed(() => this.user()?.email ?? '');
  userRol = computed(() => this.user()?.rol ?? '');
  userInitials = computed(() => {
    const name = this.user()?.nombre ?? '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.user.set(this.authService.getUser());
    }
  }

  toggleMobileSidebar() { this.mobileSidebarOpen.update(v => !v); }
  openPasswordModal() { this.isPasswordModalOpen.set(true); }
  closePasswordModal() { this.isPasswordModalOpen.set(false); }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
