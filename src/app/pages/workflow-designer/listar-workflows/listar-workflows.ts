import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/button/button';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { WorkflowService, PlantillaWorkflowDTO } from '../../../services/workflow.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { DialogService } from '../../../shared/dialog/dialog.service';

@Component({
  selector: 'app-listar-workflows',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col">
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <h2 class="text-lg font-semibold text-white">Gestión de Workflows</h2>
          <app-button variant="primary" size="sm" routerLink="/designer">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Crear Nuevo Workflow
            </span>
          </app-button>
        </header>

        <main class="flex-1 p-6 lg:p-8 overflow-auto">
          <!-- Loading -->
          @if (isLoading()) {
            <div class="flex justify-center items-center py-20">
              <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm text-gray-400">Cargando workflows...</p>
              </div>
            </div>
          }

          <!-- Empty State -->
          @if (!isLoading() && workflows().length === 0) {
            <div class="flex flex-col items-center justify-center text-center py-20">
              <div class="w-20 h-20 rounded-2xl bg-purple-700/20 flex items-center justify-center mb-6">
                <svg class="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 class="text-xl font-semibold text-white mb-2">No hay workflows creados</h3>
              <p class="text-gray-400 text-sm max-w-md mb-6">Crea tu primer workflow con nuestro editor visual con IA integrada para automatizar los procesos de tu organización.</p>
              <app-button variant="primary" size="sm" routerLink="/designer">
                Crear Primer Workflow
              </app-button>
            </div>
          }

          <!-- Workflows Table -->
          @if (!isLoading() && workflows().length > 0) {
            <div class="glass rounded-2xl overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-surface-700">
                    <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Nombre</th>
                    <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Categoría</th>
                    <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Costo</th>
                    <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Pasos</th>
                    <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Estado</th>
                    <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (wf of workflows(); track wf.id) {
                    <tr class="border-b border-surface-800 hover:bg-surface-800/50 transition-colors">
                      <td class="px-6 py-4">
                        <div>
                          <p class="text-sm font-medium text-white">{{ wf.nombre }}</p>
                          <p class="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{{ wf.descripcion || 'Sin descripción' }}</p>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span 
                          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                          [class.bg-emerald-500/10]="wf.categoria === 'INTERNO'"
                          [class.text-emerald-400]="wf.categoria === 'INTERNO'" 
                          [class.border-emerald-500/20]="wf.categoria === 'INTERNO'"
                          [class.bg-violet-500/10]="wf.categoria === 'EXTERNO'"
                          [class.text-violet-400]="wf.categoria === 'EXTERNO'"
                          [class.border-violet-500/20]="wf.categoria === 'EXTERNO'"
                        >
                          {{ wf.categoria }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-300">{{ wf.costoBase > 0 ? ('USDT. ' + wf.costoBase) : 'Gratis' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-300">{{ wf.pasos.length || 0 }} pasos</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button 
                          (click)="toggleActive(wf)"
                          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-surface-900"
                          [class.bg-emerald-500]="wf.isActive"
                          [class.bg-surface-600]="!wf.isActive"
                        >
                          <span 
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                            [class.translate-x-6]="wf.isActive"
                            [class.translate-x-1]="!wf.isActive"
                          ></span>
                        </button>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex justify-center gap-2">
                          <button 
                            (click)="editWorkflow(wf)"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-700/20 border border-purple-700/30 rounded-lg hover:bg-purple-700/30 transition-colors"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </main>
      </div>
    </div>
  `
})
export class ListarWorkflowsPage implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  workflows = signal<PlantillaWorkflowDTO[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadWorkflows();
  }

  private loadWorkflows() {
    this.isLoading.set(true);
    this.workflowService.getAllWorkflows().subscribe({
      next: (data) => {
        this.workflows.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error cargando los workflows.');
        this.isLoading.set(false);
      }
    });
  }

  editWorkflow(wf: PlantillaWorkflowDTO) {
    this.router.navigate(['/designer', wf.id]);
  }

  toggleActive(wf: PlantillaWorkflowDTO) {
    this.workflowService.toggleActive(wf.id!).subscribe({
      next: (updated) => {
        // Update local list
        this.workflows.update(list => 
          list.map(w => w.id === updated.id ? updated : w)
        );
        this.toast.success(updated.isActive ? 'Workflow activado.' : 'Workflow desactivado.');
      },
      error: () => {
        this.toast.error('Error actualizando el estado.');
      }
    });
  }
}
