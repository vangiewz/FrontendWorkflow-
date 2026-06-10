import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';

export interface PaqueteCard {
  title: string;
  description: string;
  icon: string;
  route?: string;
  disabled?: boolean;
  requiredRole?: string | string[];
}

@Component({
  selector: 'app-paquete-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-surface-950 font-sans">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center px-6 shrink-0 z-10 sticky top-0">
           <button class="lg:hidden text-gray-400 hover:text-white p-2 mr-4" (click)="toggleMobileSidebar()" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h2 class="text-lg font-semibold text-white tracking-wide truncate max-w-sm sm:max-w-none">{{ title() }}</h2>
        </header>

        <!-- Mobile sidebar overlay -->
        @if (mobileSidebarOpen()) {
           <div class="fixed inset-0 z-50 lg:hidden" (click)="toggleMobileSidebar()">
             <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
             <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
           </div>
        }

        <main class="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div class="max-w-6xl mx-auto space-y-10">
             
             <!-- Header Section -->
             <div>
                <h1 class="text-3xl font-extrabold text-white mb-3 tracking-tight">{{ title() }}</h1>
                <p class="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">{{ description() }}</p>
             </div>

             <!-- Cards Grid -->
             <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                @for (card of cards(); track card.title) {
                   @if (card.disabled) {
                      <div class="bg-surface-800/50 border border-surface-700/50 rounded-2xl p-6 opacity-60 cursor-not-allowed select-none transition-all flex flex-col justify-between min-h-[140px]">
                         <div>
                            <div class="flex items-center gap-4 mb-3">
                               <div class="w-12 h-12 rounded-xl bg-surface-700/50 flex items-center justify-center text-xl text-gray-500">{{ card.icon }}</div>
                               <h3 class="text-lg font-bold text-gray-300">{{ card.title }}</h3>
                            </div>
                            <p class="text-sm text-gray-500 font-medium ml-16">{{ card.description }}</p>
                         </div>
                         <div class="mt-4 pt-4 border-t border-surface-700/50 flex justify-end">
                            <span class="text-xs font-bold text-violet-400 uppercase tracking-widest px-3 py-1 bg-violet-500/10 rounded-full">Próximamente</span>
                         </div>
                      </div>
                   } @else {
                      <a [routerLink]="card.route" class="group bg-surface-800 border border-surface-700 hover:border-violet-500/40 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/5 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
                         <div>
                            <div class="flex items-center gap-4 mb-3">
                               <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 group-hover:bg-violet-500/20 text-violet-300">{{ card.icon }}</div>
                               <h3 class="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{{ card.title }}</h3>
                            </div>
                            <p class="text-sm text-gray-400 group-hover:text-gray-300 ml-16">{{ card.description }}</p>
                         </div>
                         <div class="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                         </div>
                      </a>
                   }
                }
             </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class PaqueteHubPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  mobileSidebarOpen = signal(false);
  title = signal<string>('');
  description = signal<string>('');
  cards = signal<PaqueteCard[]>([]);

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.title.set(data['title'] || 'Paquete');
      this.description.set(data['description'] || 'Módulo funcional del sistema.');
      
      const allCards: PaqueteCard[] = data['cards'] || [];
      const userRole = this.authService.getUser()?.rol || '';
      
      const filteredCards = allCards.filter(card => {
        if (!card.requiredRole) return true;
        const requiredRoles = Array.isArray(card.requiredRole) ? card.requiredRole : [card.requiredRole];
        // Asume que a veces el backend envía ROLE_ADMIN o solo ADMIN
        const userRoleNormalized = userRole.replace('ROLE_', '');
        return requiredRoles.some(r => r.replace('ROLE_', '') === userRoleNormalized);
      });
      
      this.cards.set(filteredCards);
    });
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }
}
