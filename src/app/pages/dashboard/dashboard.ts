import { Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-950 font-sans">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center px-6 shrink-0 z-10 sticky top-0">
          <button class="lg:hidden text-gray-400 hover:text-white p-2 mr-4" (click)="toggleMobileSidebar()" aria-label="Abrir menú">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h2 class="text-lg font-semibold text-white tracking-wide">Inicio</h2>
        </header>

        @if (mobileSidebarOpen()) {
          <div class="fixed inset-0 z-50 lg:hidden" (click)="toggleMobileSidebar()">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
          </div>
        }

        <main class="flex-1 overflow-y-auto">
          <!-- Hero Section -->
          <section class="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
            <!-- Background glows -->
            <div class="absolute inset-0 pointer-events-none select-none">
              <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]"></div>
              <div class="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-purple-500/8 rounded-full blur-[100px]"></div>
            </div>

            <div class="relative z-10 max-w-4xl mx-auto">
              <!-- Badge -->
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-8">
                <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span>
                Sistema de Gestión Institucional
              </div>

              <!-- Title -->
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Bienvenido,
                <span class="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"> {{ userName() }}</span>
              </h1>

              <!-- Role badge -->
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 border border-surface-700 text-sm font-medium text-gray-300 mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 018 0v2"/></svg>
                Acceso como <span class="font-bold text-violet-300 ml-1">{{ userRol() }}</span>
              </div>

              <p class="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                Plataforma inteligente de automatización de trámites institucionales. Combina 
                <span class="text-white font-medium">Inteligencia Artificial</span> con 
                <span class="text-white font-medium">flujos de trabajo colaborativos</span> para optimizar los procesos administrativos.
              </p>
            </div>
          </section>

          <!-- Objective Cards -->
          <section class="px-6 pb-16">
            <div class="max-w-6xl mx-auto">
              <div class="text-center mb-12">
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">¿Qué ofrece este sistema?</h2>
                <p class="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">Cada módulo está diseñado para cubrir un área crítica de la operación institucional.</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- CU-01 -->
                <div class="glass rounded-2xl p-6 group hover:border-violet-500/30 transition-all duration-300">
                  <div class="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">🔐</div>
                  <h3 class="text-base font-bold text-white mb-2">Seguridad y Acceso</h3>
                  <p class="text-sm text-gray-400 leading-relaxed">Autenticación JWT y encriptación BCrypt garantizan que solo actores autorizados operen en el sistema.</p>
                </div>
                <!-- CU-02 -->
                <div class="glass rounded-2xl p-6 group hover:border-violet-500/30 transition-all duration-300">
                  <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">🏢</div>
                  <h3 class="text-base font-bold text-white mb-2">Organización Interna</h3>
                  <p class="text-sm text-gray-400 leading-relaxed">El Administrador gestiona departamentos y funcionarios, estructurando el equipo de trabajo institucional.</p>
                </div>
                <!-- CU-03 -->
                <div class="glass rounded-2xl p-6 group hover:border-violet-500/30 transition-all duration-300">
                  <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">🧠</div>
                  <h3 class="text-base font-bold text-white mb-2">IA y Automatización</h3>
                  <p class="text-sm text-gray-400 leading-relaxed">La IA genera automáticamente rutas de trámites y formularios dinámicos a partir de políticas en lenguaje natural.</p>
                </div>
                <!-- CU-04/05/06 -->
                <div class="glass rounded-2xl p-6 group hover:border-violet-500/30 transition-all duration-300">
                  <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">⚙️</div>
                  <h3 class="text-base font-bold text-white mb-2">Gestión de Trámites</h3>
                  <p class="text-sm text-gray-400 leading-relaxed">Desde la solicitud del cliente hasta la resolución del funcionario, con seguimiento en tiempo real y notificaciones push.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Tech Stack Footer -->
          <section class="border-t border-surface-800 px-6 py-10">
            <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <p class="text-sm text-gray-500 text-center sm:text-left">
                Construido sobre <span class="text-gray-300 font-medium">Spring Boot</span> · <span class="text-gray-300 font-medium">MongoDB</span> · <span class="text-gray-300 font-medium">Angular</span> · <span class="text-gray-300 font-medium">Flutter</span>
              </p>
              <div class="flex items-center gap-3 text-xs text-gray-600">
                <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                Todos los servicios activos
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `
})
export class DashboardPage {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  mobileSidebarOpen = signal(false);
  private user = signal<AuthResponse | null>(null);

  userName = computed(() => this.user()?.nombre ?? 'Usuario');
  userRol = computed(() => this.user()?.rol ?? '');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.user.set(this.authService.getUser());
    }
  }

  toggleMobileSidebar() { this.mobileSidebarOpen.update(v => !v); }
}
