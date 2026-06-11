import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { ButtonComponent } from '../../shared/button/button';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { ToastService } from '../../shared/toast/toast.service';

interface TramiteSLA {
  id: string;
  nombrePlantilla: string;
  prioridad: string;
  riesgoDemora: boolean;
  esAnomalo?: boolean;
  tiempoEstimadoDias: number;
  fechaCreacion: string;
  pasosActualesIds: string[];
}

@Component({
  selector: 'app-sla-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ButtonComponent, RouterLink],
  template: `
    <div class="min-h-screen flex bg-[#0B0F19] font-sans selection:bg-rose-500/30">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <header class="h-16 border-b border-white/10 bg-[#0B0F19]/50 backdrop-blur-sm flex items-center px-6 shrink-0 z-10 sticky top-0 gap-4">
           <button class="lg:hidden text-gray-400 hover:text-white p-2" (click)="toggleMobileSidebar()">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h2 class="text-lg font-semibold text-white tracking-wide truncate">Centro de Alertas de IA</h2>
        </header>

        @if (mobileSidebarOpen()) {
           <div class="fixed inset-0 z-50 lg:hidden" (click)="toggleMobileSidebar()">
             <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
             <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
           </div>
        }

        <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div class="max-w-6xl mx-auto space-y-8">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <app-button variant="outline" size="sm" routerLink="/paquetes/configuracion-ia">
                    ← Volver
                  </app-button>
                  <h1 class="text-3xl font-bold text-white">Centro de Alertas: SLAs y Anomalías</h1>
                </div>
                <p class="text-gray-400 text-sm max-w-2xl">
                  Supervisa los trámites que han excedido su SLA o que han sido marcados como anómalos por el Isolation Forest (IA).
                </p>
              </div>

              @if (activeTab() === 'SLA') {
                <div class="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-4 shrink-0">
                  <div class="text-sm">
                    <p class="font-bold text-rose-400">Motor Manual</p>
                    <p class="text-gray-400 text-xs">Fuerza el escaneo inmediato</p>
                  </div>
                  <app-button variant="primary" size="sm" (click)="forceSlaCheck()" [disabled]="isChecking()">
                    {{ isChecking() ? 'Escaneando BD...' : 'Ejecutar Motor SLA Ahora' }}
                  </app-button>
                </div>
              }
            </div>

            <!-- Tabs -->
            <div class="flex space-x-1 bg-white/[0.02] p-1 rounded-xl border border-white/10 w-fit">
              <button 
                (click)="activeTab.set('SLA')"
                [class.bg-white_0.1]="activeTab() === 'SLA'"
                [class.text-white]="activeTab() === 'SLA'"
                [class.text-gray-400]="activeTab() !== 'SLA'"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                [ngClass]="activeTab() === 'SLA' ? 'bg-white/10 shadow-sm' : 'hover:bg-white/5'">
                <span>⏱️</span> SLAs Vencidos
                @if (tramitesSLA().length > 0) {
                  <span class="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{tramitesSLA().length}}</span>
                }
              </button>
              <button 
                (click)="activeTab.set('ANOMALIAS')"
                [class.bg-white_0.1]="activeTab() === 'ANOMALIAS'"
                [class.text-white]="activeTab() === 'ANOMALIAS'"
                [class.text-gray-400]="activeTab() !== 'ANOMALIAS'"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                [ngClass]="activeTab() === 'ANOMALIAS' ? 'bg-white/10 shadow-sm' : 'hover:bg-white/5'">
                <span>👽</span> Anomalías Detectadas
                @if (tramitesAnomalos().length > 0) {
                  <span class="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{tramitesAnomalos().length}}</span>
                }
              </button>
            </div>

            @if (successMessage()) {
              <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3 animate-fade-in">
                <span class="text-xl">✅</span>
                <span class="font-medium">{{ successMessage() }}</span>
              </div>
            }

            <!-- SLA Table -->
            @if (activeTab() === 'SLA') {
              <div class="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-fade-in">
                <div class="p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                    <span>📋</span> Trámites Escalados Recientemente
                  </h3>
                  <span class="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">
                    {{ tramitesSLA().length }} en Riesgo
                  </span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-white/[0.02] text-gray-400 text-xs uppercase tracking-wider">
                        <th class="px-6 py-4 font-medium">Nombre del Trámite</th>
                        <th class="px-6 py-4 font-medium">Nodos (Funcionario)</th>
                        <th class="px-6 py-4 font-medium">Predicho por IA</th>
                        <th class="px-6 py-4 font-medium">Días Estancado</th>
                        <th class="px-6 py-4 font-medium text-center">Prioridad Actual</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5 text-sm">
                      @for (t of tramitesSLA(); track t.id) {
                        <tr class="hover:bg-white/[0.02] transition-colors" [ngClass]="{'bg-rose-500/[0.05]': isNewlyEscalated(t.id)}">
                          <td class="px-6 py-4">
                            <div class="font-medium text-white">{{ t.nombrePlantilla }}</div>
                            <div class="text-xs text-gray-500 truncate w-32" title="{{ t.id }}">ID: {{ t.id | slice:0:8 }}...</div>
                          </td>
                          <td class="px-6 py-4 text-gray-300">
                            <span class="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 text-xs">
                              {{ t.pasosActualesIds && t.pasosActualesIds.length ? t.pasosActualesIds.join(', ') : 'Desconocido' }}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="text-cyan-400 font-semibold">{{ t.tiempoEstimadoDias | number:'1.1-1' }} días</div>
                            <div class="text-xs text-gray-500">TensorFlow</div>
                          </td>
                          <td class="px-6 py-4">
                            <div class="text-rose-400 font-bold flex items-center gap-2">
                              <span>⏱️</span> {{ calculateDays(t.fechaCreacion) }} días
                            </div>
                          </td>
                          <td class="px-6 py-4 text-center">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] border border-rose-400 animate-pulse">
                              <span>🚨</span> ALTA
                            </span>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="px-6 py-12 text-center text-gray-400">
                            <div class="text-3xl mb-3">✨</div>
                            <p>No hay trámites estancados en este momento.</p>
                            <p class="text-xs mt-1 text-gray-500">Todos los SLAs se están cumpliendo a tiempo.</p>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Anomalies Table -->
            @if (activeTab() === 'ANOMALIAS') {
              <div class="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl animate-fade-in">
                <div class="p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                    <span>👽</span> Trámites Anómalos Detectados
                  </h3>
                  <span class="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
                    {{ tramitesAnomalos().length }} Anomalías
                  </span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-white/[0.02] text-gray-400 text-xs uppercase tracking-wider">
                        <th class="px-6 py-4 font-medium">Nombre del Trámite</th>
                        <th class="px-6 py-4 font-medium">Nodos (Funcionario)</th>
                        <th class="px-6 py-4 font-medium">Fecha Detección</th>
                        <th class="px-6 py-4 font-medium text-center">Alerta IA</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5 text-sm">
                      @for (t of tramitesAnomalos(); track t.id) {
                        <tr class="hover:bg-white/[0.02] transition-colors">
                          <td class="px-6 py-4">
                            <div class="font-medium text-white">{{ t.nombrePlantilla }}</div>
                            <div class="text-xs text-gray-500 truncate w-32" title="{{ t.id }}">ID: {{ t.id | slice:0:8 }}...</div>
                          </td>
                          <td class="px-6 py-4 text-gray-300">
                            <span class="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 text-xs">
                              {{ t.pasosActualesIds && t.pasosActualesIds.length ? t.pasosActualesIds.join(', ') : 'Desconocido' }}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="text-gray-300">{{ t.fechaCreacion | date:'medium' }}</div>
                          </td>
                          <td class="px-6 py-4 text-center">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] border border-orange-500/50">
                              <span>👽</span> Anómalo
                            </span>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" class="px-6 py-12 text-center text-gray-400">
                            <div class="text-3xl mb-3">🛡️</div>
                            <p>No se han detectado anomalías.</p>
                            <p class="text-xs mt-1 text-gray-500">El modelo Isolation Forest informa que todo opera con normalidad.</p>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SlaDashboardComponent implements OnInit {
  mobileSidebarOpen = signal<boolean>(false);
  isChecking = signal<boolean>(false);
  successMessage = signal<string>('');
  
  activeTab = signal<'SLA' | 'ANOMALIAS'>('SLA');
  tramitesSLA = signal<TramiteSLA[]>([]);
  tramitesAnomalos = signal<TramiteSLA[]>([]);
  newlyEscalatedIds = signal<Set<string>>(new Set());

  private http = inject(HttpClient);
  private offlineQueue = inject(OfflineQueueService);
  private toast = inject(ToastService);

  ngOnInit() {
    this.loadEscalated();
    this.loadAnomalies();
    
    // Escuchar cuando vuelva online para actualizar la lista de SLA
    this.offlineQueue.syncCompleted$.subscribe(event => {
       if (event.request.url.includes('/force-sla-check') && event.success) {
          this.loadEscalated();
          this.toast.success('El motor SLA se ejecutó en segundo plano exitosamente.');
       }
    });
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  calculateDays(fechaStr: string): number {
    if (!fechaStr) return 0;
    const past = new Date(fechaStr).getTime();
    const now = new Date().getTime();
    const diff = now - past;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  isNewlyEscalated(id: string): boolean {
    return this.newlyEscalatedIds().has(id);
  }

  loadEscalated() {
    this.http.get<TramiteSLA[]>(`${environment.apiUrl}/workflows/ai/routing/escalated`)
      .subscribe({
        next: (data) => this.tramitesSLA.set(data),
        error: (err) => console.error('Error cargando SLAs', err)
      });
  }

  loadAnomalies() {
    this.http.get<TramiteSLA[]>(`${environment.apiUrl}/workflows/ai/routing/anomalies`)
      .subscribe({
        next: (data) => this.tramitesAnomalos.set(data),
        error: (err) => console.error('Error cargando Anomalías', err)
      });
  }

  forceSlaCheck() {
    this.isChecking.set(true);
    this.successMessage.set('');
    
    this.http.post<{message?: string, escalatedCount?: number, tramites?: TramiteSLA[], queued?: boolean}>(`${environment.apiUrl}/workflows/ai/routing/force-sla-check`, {})
      .subscribe({
        next: (res) => {
          this.isChecking.set(false);
          if (res.queued) {
             return;
          }
          this.successMessage.set(res.message || '');
          
          const oldIds = new Set(this.tramitesSLA().map(t => t.id));
          const newIds = new Set<string>((res.tramites || []).map((t: TramiteSLA) => t.id).filter((id: string) => !oldIds.has(id)));
          
          this.newlyEscalatedIds.set(newIds);
          this.tramitesSLA.set(res.tramites || []);

          setTimeout(() => this.successMessage.set(''), 25000);
          setTimeout(() => this.newlyEscalatedIds.set(new Set()), 5000);
        },
        error: (err) => {
          console.error(err);
          this.isChecking.set(false);
          this.successMessage.set('Hubo un error al ejecutar el Job.');
        }
      });
  }
}
