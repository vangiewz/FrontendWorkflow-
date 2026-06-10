import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SidebarComponent } from '../../shared/sidebar/sidebar';

interface SimulationResult {
  prioridad: string;
  riesgoDemora: boolean;
  tiempoEstimadoDias: number;
  rutaSugerida: string;
  esAnomalo: boolean;
}

@Component({
  selector: 'app-routing-predictivo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonComponent, SidebarComponent],
  template: `
    <div class="min-h-screen flex bg-[#0B0F19] font-sans selection:bg-emerald-500/30">
      <!-- Desktop Sidebar -->
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <header class="h-16 border-b border-white/10 bg-[#0B0F19]/50 backdrop-blur-sm flex items-center px-6 shrink-0 z-10 sticky top-0 gap-4">
           <button class="lg:hidden text-gray-400 hover:text-white p-2" (click)="toggleMobileSidebar()" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h2 class="text-lg font-semibold text-white tracking-wide truncate">Motor Inteligente de Enrutamiento</h2>
        </header>

        <!-- Mobile sidebar overlay -->
        @if (mobileSidebarOpen()) {
           <div class="fixed inset-0 z-50 lg:hidden" (click)="toggleMobileSidebar()">
             <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
             <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
           </div>
        }

        <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div class="max-w-5xl mx-auto">
            <!-- Título y Volver -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <app-button variant="outline" size="sm" routerLink="/paquetes/configuracion-ia" class="self-start">
                ← Volver a Configuración e IA
              </app-button>
              <div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Simulador de Enrutamiento Predictivo
                </h1>
                <p class="text-sm text-gray-400 mt-1">
                  Arquitectura Híbrida: Multi-Layer Perceptron (Red Neuronal) + Isolation Forest + LLM (Claude Haiku).
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Formulario de Simulación -->
              <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span>🎛️</span> Parámetros del Trámite
                </h2>

                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Nombre del Trámite</label>
                    <input type="text" [(ngModel)]="nombrePlantilla" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600" placeholder="Ej. Solicitud de Licencia Comercial">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Descripción / Política</label>
                    <textarea [(ngModel)]="descripcionPolitica" rows="2" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600" placeholder="Ej. El cliente solicita una licencia para un restaurante..."></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-400 mb-1">Departamento</label>
                      <select [(ngModel)]="departamentoAsignado" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none">
                        <option value="Administrativo">Administrativo</option>
                        <option value="Legal">Legal</option>
                        <option value="Financiero">Financiero</option>
                        <option value="Tecnico">Técnico</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-400 mb-1">Carga Actual</label>
                      <input type="number" [(ngModel)]="cargaActualDepartamento" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all">
                    </div>
                  </div>

                  <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                    <input type="checkbox" id="esFinSemana" [(ngModel)]="esViernesOFinSemana" class="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/50 bg-gray-700">
                    <label for="esFinSemana" class="text-sm font-medium text-gray-300 select-none cursor-pointer">
                      ¿Es Viernes por la tarde o Fin de semana?
                    </label>
                  </div>

                  <div class="pt-4">
                    <app-button variant="primary" class="w-full" (click)="simulate()" [disabled]="isLoading()">
                      {{ isLoading() ? 'Procesando Red Neuronal...' : 'Ejecutar Predicción' }}
                    </app-button>
                  </div>
                </div>
              </div>

              <!-- Resultados de Simulación -->
              <div class="space-y-6">
                @if (result(); as res) {
                  <!-- Routing & Anomalies -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
                      <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-all"></div>
                      <h3 class="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">Ruta Sugerida</h3>
                      <div class="text-xl font-bold text-white">{{ res.rutaSugerida }}</div>
                      <p class="text-xs text-indigo-400 mt-2">Extraída por Claude Haiku</p>
                    </div>

                    <div class="bg-gradient-to-br border rounded-2xl p-5 backdrop-blur-md relative overflow-hidden transition-all"
                         [ngClass]="res.esAnomalo ? 'from-rose-500/10 to-red-500/5 border-rose-500/30' : 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20'">
                      <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" [ngClass]="res.esAnomalo ? 'text-rose-400' : 'text-emerald-400'">Detector de Anomalías</h3>
                      <div class="flex items-center gap-3">
                        <span class="text-3xl">{{ res.esAnomalo ? '🚨' : '✅' }}</span>
                        <div class="text-lg font-bold text-white">{{ res.esAnomalo ? 'Trámite Atípico' : 'Normal' }}</div>
                      </div>
                      <p class="text-xs mt-2" [ngClass]="res.esAnomalo ? 'text-rose-300' : 'text-emerald-300'">Isolation Forest</p>
                    </div>
                  </div>

                  <!-- Priority & Time -->
                  <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                    <h3 class="text-sm font-semibold text-gray-300 mb-6 flex items-center gap-2">
                      <span>🧠</span> Predicción del Multi-Layer Perceptron
                    </h3>
                    
                    <div class="space-y-6">
                      <!-- Priority -->
                      <div>
                        <div class="flex justify-between text-sm mb-2">
                          <span class="text-gray-400">Prioridad Asignada</span>
                          <span class="font-bold" 
                                [ngClass]="{'text-rose-400': res.prioridad === 'ALTA', 'text-amber-400': res.prioridad === 'MEDIA', 'text-emerald-400': res.prioridad === 'BAJA'}">
                            {{ res.prioridad }}
                          </span>
                        </div>
                        <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-1000"
                               [ngClass]="{'bg-rose-500 w-[95%]': res.prioridad === 'ALTA', 'bg-amber-500 w-[60%]': res.prioridad === 'MEDIA', 'bg-emerald-500 w-[30%]': res.prioridad === 'BAJA'}"></div>
                        </div>
                      </div>

                      <!-- Demora -->
                      <div>
                        <div class="flex justify-between text-sm mb-2">
                          <span class="text-gray-400">Riesgo de Demora</span>
                          <span class="font-bold" [ngClass]="res.riesgoDemora ? 'text-rose-400' : 'text-emerald-400'">
                            {{ res.riesgoDemora ? 'ALTO' : 'BAJO' }}
                          </span>
                        </div>
                      </div>

                      <!-- Time Regression -->
                      <div class="pt-4 border-t border-white/10">
                        <div class="flex justify-between text-sm mb-1">
                          <span class="text-gray-400">Tiempo Estimado de Resolución</span>
                          <span class="text-2xl font-bold text-cyan-400">{{ res.tiempoEstimadoDias | number:'1.1-1' }} <span class="text-sm font-normal text-cyan-500">días</span></span>
                        </div>
                        <p class="text-xs text-gray-500">Calculado mediante MLPRegressor</p>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="h-full flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl text-center">
                    <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <span class="text-2xl">🤖</span>
                    </div>
                    <h3 class="text-lg font-medium text-white mb-2">Esperando Datos</h3>
                    <p class="text-sm text-gray-400 max-w-xs">
                      Ingresa los parámetros a la izquierda y ejecuta la simulación para ver la predicción de la IA en tiempo real.
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class RoutingPredictivoComponent {
  nombrePlantilla = 'Renovación de Contrato Comercial';
  descripcionPolitica = 'El cliente solicita renovar su contrato bajo cláusulas de urgencia y menciona posibles multas si no se aprueba pronto.';
  departamentoAsignado = 'Legal';
  cargaActualDepartamento = 45;
  esViernesOFinSemana = true;

  isLoading = signal<boolean>(false);
  result = signal<SimulationResult | null>(null);
  mobileSidebarOpen = signal<boolean>(false);

  private http = inject(HttpClient);

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  simulate() {
    this.isLoading.set(true);
    
    const payload = {
      nombrePlantilla: this.nombrePlantilla,
      descripcionPolitica: this.descripcionPolitica,
      departamentoAsignado: this.departamentoAsignado,
      cargaActualDepartamento: this.cargaActualDepartamento,
      esViernesOFinSemana: this.esViernesOFinSemana,
      datosCliente: {}
    };

    this.http.post<SimulationResult>(`${environment.apiUrl}/workflows/ai/routing/simulate`, payload)
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
  }
}
