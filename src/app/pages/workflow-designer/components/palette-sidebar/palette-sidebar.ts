import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowStateService } from '../../services/workflow-state.service';

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
          <h3 class="text-xs text-gray-400 mb-2">Nodos UML</h3>
          <div class="grid grid-cols-1 gap-2">
            <div 
              draggable="true"
              (dragstart)="onDragStart($event, 'Actividad')"
              class="bg-surface-800 border border-surface-700 p-3 rounded-lg text-xs text-center text-gray-300 cursor-grab active:cursor-grabbing hover:border-purple-500 hover:text-purple-400 transition-colors flex flex-col items-center gap-2"
            >
              <div class="w-6 h-4 rounded border-2 border-purple-500 bg-transparent"></div>
              Actividad
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
  
  onDragStart(event: DragEvent, type: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', type);
      event.dataTransfer.effectAllowed = 'copy';
      
      // Opcional: configurar una preview image ghost
      // event.dataTransfer.setDragImage(dummyElement, x, y);
    }
  }
}

