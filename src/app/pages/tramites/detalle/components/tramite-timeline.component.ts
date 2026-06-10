import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tramite-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      @for (paso of pasosOrdenados; track paso.id; let i = $index) {
        <!-- Clickeable para ver form en histórico, no interactivo si futuro -->
        <div class="flex gap-3 mb-1" 
             [class.cursor-pointer]="isPasoCompletado(paso.id) || isActiveStep(paso.id)" 
             (click)="onStepClick(paso.id)">
          <!-- Timeline dot + line -->
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all"
              [class.bg-emerald-500]="isPasoCompletado(paso.id) && selectedStepId !== paso.id"
              [class.border-emerald-500]="isPasoCompletado(paso.id) && selectedStepId !== paso.id"
              [class.bg-emerald-400]="isPasoCompletado(paso.id) && selectedStepId === paso.id"
              [class.border-emerald-400]="isPasoCompletado(paso.id) && selectedStepId === paso.id"
              [class.shadow-lg]="selectedStepId === paso.id"
              [class.shadow-emerald-500/50]="selectedStepId === paso.id && isPasoCompletado(paso.id)"
              [class.shadow-blue-500/50]="selectedStepId === paso.id && isActiveStep(paso.id) && !isPasoCompletado(paso.id)"
              [class.text-white]="isPasoCompletado(paso.id) || isActiveStep(paso.id)"
              [class.bg-blue-500]="isActiveStep(paso.id) && !isPasoCompletado(paso.id)"
              [class.border-blue-500]="isActiveStep(paso.id) && !isPasoCompletado(paso.id)"
              [class.bg-surface-800]="!isPasoCompletado(paso.id) && !isActiveStep(paso.id)"
              [class.border-surface-600]="!isPasoCompletado(paso.id) && !isActiveStep(paso.id)"
              [class.text-gray-500]="!isPasoCompletado(paso.id) && !isActiveStep(paso.id)"
              [class.animate-pulse]="isActiveStep(paso.id) && !isPasoCompletado(paso.id)"
            >
              @if (isPasoCompletado(paso.id)) {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              } @else if (paso.tipo === 'DECISION') {
                ◆
              } @else {
                {{ i + 1 }}
              }
            </div>
            @if (i < pasosOrdenados.length - 1) {
              <div class="w-0.5 h-8 transition-colors"
                [class.bg-emerald-500/50]="isPasoCompletado(paso.id)"
                [class.bg-surface-700]="!isPasoCompletado(paso.id)"
              ></div>
            }
          </div>
          <!-- Step info -->
          <div class="pb-4 flex-1 min-w-0 flex items-center justify-between group">
            <div>
               <p class="text-sm font-medium truncate"
                 [class.text-white]="isActiveStep(paso.id) || isPasoCompletado(paso.id)"
                 [class.text-gray-500]="!isPasoCompletado(paso.id) && !isActiveStep(paso.id)"
               >
                 {{ paso.nombrePaso }}
               </p>
               <p class="text-[10px] text-gray-500 mt-0.5">
                 {{ paso.tipo === 'DECISION' ? '◆ Decisión' : getDepartamentoNombre(paso.departamentoId) }}
               </p>
               @if (isPasoCompletado(paso.id) && getTiempoPaso(paso.id)) {
                 <div class="flex items-center gap-2 mt-1">
                   <p class="text-[10px] text-emerald-400/60 font-medium">⏱ {{ getTiempoPaso(paso.id) }}</p>
                   @if (getFuncionarioPaso(paso.id)) {
                      <p class="text-[10px] text-gray-400">👤 Por: <span class="text-gray-300">{{ getFuncionarioPaso(paso.id) }}</span></p>
                   }
                 </div>
               }
               @if (isPasoCompletado(paso.id) && paso.tipo === 'DECISION') {
                 <p class="text-[10px] text-violet-400 font-bold mt-1">→ Decidió: {{ getDecisionTomada(paso.id) }}</p>
               }
            </div>
            @if (isPasoCompletado(paso.id) || isActiveStep(paso.id)) {
               <svg class="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" [class.text-emerald-400]="selectedStepId === paso.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class TramiteTimelineComponent {
  @Input() pasosOrdenados: any[] = [];
  @Input() activeStepIds: string[] = [];
  @Input() selectedStepId: string | null = null;
  @Input() tramite: any = null;
  @Input() departamentos: any[] = [];

  @Output() stepSelected = new EventEmitter<string>();

  isActiveStep(pasoId: string): boolean {
    return this.activeStepIds.includes(pasoId);
  }

  onStepClick(pasoId: string) {
    if (this.isPasoCompletado(pasoId) || this.isActiveStep(pasoId)) {
      this.stepSelected.emit(pasoId);
    }
  }

  isPasoCompletado(pasoId: string): boolean {
    return !!(this.tramite && this.tramite.respuestas && this.tramite.respuestas[pasoId]);
  }

  getDepartamentoNombre(deptoId: string | null | undefined): string {
    if (!deptoId) return '👤 Cliente';
    const depto = this.departamentos.find(d => d.id === deptoId);
    return depto ? depto.nombre : deptoId;
  }

  getTiempoPaso(pasoId: string): string {
    if (!this.tramite || !this.tramite.historialTiempos) return '';
    const reg = this.tramite.historialTiempos.find((r:any) => r.pasoId === pasoId && r.fechaSalida);
    if (!reg) return '';
    const entrada = new Date(reg.fechaEntrada).getTime();
    const salida = new Date(reg.fechaSalida).getTime();
    const diffMs = salida - entrada;
    if (diffMs < 0) return '';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  }

  getDecisionTomada(pasoId: string): string {
    if (!this.tramite || !this.tramite.respuestas || !this.tramite.respuestas[pasoId]) return '—';
    return (this.tramite.respuestas[pasoId]['decision'] as string) || '—';
  }

  getFuncionarioPaso(pasoId: string): string | null {
    if (!this.tramite || !this.tramite.historialTiempos) return null;
    const reg = this.tramite.historialTiempos.find((r:any) => r.pasoId === pasoId && r.fechaSalida);
    return reg && reg.funcionarioNombre ? reg.funcionarioNombre : null;
  }
}
