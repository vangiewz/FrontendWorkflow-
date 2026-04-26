import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowStateService } from '../../services/workflow-state.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-palette-sidebar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-64 h-full border-r border-surface-800 bg-surface-900 flex flex-col z-10 shrink-0 select-none">
      <div class="p-4 border-b border-surface-800">
        <h2 class="text-sm font-semibold text-white uppercase tracking-wider">Paleta</h2>
      </div>
      <div class="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        
        <div>
          <div class="mb-4 bg-surface-800 border border-surface-700 p-2 rounded-lg">
            <h3 class="text-xs text-gray-400 mb-2 font-semibold">Modo de Interacción</h3>
            <button 
              (click)="workflowState.toggleDrawArrowMode()"
              class="w-full p-2 text-xs rounded transition-colors flex items-center justify-center gap-2"
              [class.bg-emerald-500]="workflowState.isDrawArrowMode()"
              [class.text-white]="workflowState.isDrawArrowMode()"
              [class.bg-surface-700]="!workflowState.isDrawArrowMode()"
              [class.text-gray-400]="!workflowState.isDrawArrowMode()"
              [class.hover:bg-surface-600]="!workflowState.isDrawArrowMode()"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              {{ workflowState.isDrawArrowMode() ? 'Dibujo de Flechas' : 'Puntero / Editor' }}
            </button>
          </div>

          <h3 class="text-xs text-gray-400 mb-2">Nodos UML</h3>
          <div class="grid grid-cols-1 gap-2">
            <div 
              draggable="true"
              (dragstart)="onDragStart($event, 'Actividad')"
              (click)="onItemClick('Actividad')"
              class="bg-surface-800 border border-surface-700 p-3 rounded-lg text-xs text-center text-gray-300 cursor-grab active:cursor-grabbing hover:border-purple-500 hover:text-purple-400 transition-colors flex flex-col items-center gap-2"
            >
              <div class="w-6 h-4 rounded border-2 border-purple-500 bg-transparent"></div>
              Actividad
            </div>
            <div 
              draggable="true"
              (dragstart)="onDragStart($event, 'Decisión')"
              (click)="onItemClick('Decisión')"
              class="bg-surface-800 border border-surface-700 p-3 rounded-lg text-xs text-center text-gray-300 cursor-grab active:cursor-grabbing hover:border-amber-500 hover:text-amber-400 transition-colors flex flex-col items-center gap-2"
            >
              <div class="w-4 h-4 rounded-sm border-2 border-amber-500 bg-transparent rotate-45 mt-1 mb-1"></div>
              Decisión
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-xs text-gray-400 mb-2">Departamentos (Lanes)</h3>
          <div class="flex flex-col gap-2">
            @for (depto of workflowState.departamentos(); track depto.id) {
              <div 
                draggable="true"
                (dragstart)="onDragStart($event, depto.id)"
                (click)="onItemClick(depto.id)"
                class="bg-surface-800/50 border border-surface-700 w-full p-2.5 rounded-lg text-xs text-gray-300 cursor-grab active:cursor-grabbing hover:bg-surface-800 hover:border-emerald-500 transition-colors flex items-center gap-2"
              >
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                {{ depto.nombre }}
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class PaletteSidebarComponent {
  workflowState = inject(WorkflowStateService);
  private toast = inject(ToastService);
  
  onDragStart(event: DragEvent, type: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', type);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onItemClick(type: string) {
    // Si la pantalla es táctil/móvil, el click agrega el nodo directamente
    this.workflowState.appendNode(type);
    this.toast.success(`Se añadió: ${type === 'Actividad' || type === 'Decisión' ? type : 'Nuevo carril'} al diagrama.`);
  }
}

