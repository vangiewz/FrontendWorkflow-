import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button';
import { PaletteSidebarComponent } from './components/palette-sidebar/palette-sidebar';
import { JointjsCanvasComponent } from './components/jointjs-canvas/jointjs-canvas';
import { AiChatSidebarComponent } from './components/ai-chat-sidebar/ai-chat-sidebar';
import { WorkflowStateService } from './services/workflow-state.service';
import { DepartamentoService } from '../../services/departamento.service';
import { JointjsEngineService } from './services/jointjs-engine.service';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-workflow-designer',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ButtonComponent,
    PaletteSidebarComponent,
    JointjsCanvasComponent,
    AiChatSidebarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-full bg-surface-950 flex flex-col font-sans overflow-hidden">
      <!-- Top header -->
      <header class="h-14 border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-20">
        <div class="flex items-center gap-4">
          <a routerLink="/dashboard" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span class="font-medium text-sm">Dashboard</span>
          </a>
          <div class="h-5 w-px bg-surface-700"></div>
          <h1 class="text-sm font-semibold text-white tracking-tight">Editor Visual de Workflows</h1>
        </div>
        
        <div class="flex items-center gap-3">
          @if (!workflowState.isChatExpanded()) {
            <app-button variant="outline" size="sm" (click)="workflowState.toggleChat()">
              Abrir Asistente IA
            </app-button>
          }
          <app-button variant="primary" size="sm" (click)="guardarWorkflow()">
            Guardar en MongoDB
          </app-button>
        </div>
      </header>

      <!-- 3 Columns Layout: Flexbox makes expanding/collapsing easy -->
      <main class="flex-1 flex overflow-hidden relative">
        <!-- Col 1: Palette -->
        <app-palette-sidebar></app-palette-sidebar>

        <!-- Col 2: Canvas (grows to fill empty space) -->
        <div class="flex-1 overflow-hidden relative">
          <app-jointjs-canvas></app-jointjs-canvas>
        </div>

        <!-- Col 3: AI Chat -->
        <app-ai-chat-sidebar></app-ai-chat-sidebar>
      </main>
    </div>
  `
})
export class WorkflowDesignerPage implements OnInit {
  workflowState = inject(WorkflowStateService);
  private engineService = inject(JointjsEngineService);
  private deptoService = inject(DepartamentoService);
  private workflowService = inject(WorkflowService);

  ngOnInit() {
    // Al abrir el diseñador, cargamos inmediatamente los departamentos reales de MongoDB
    this.deptoService.getDepartamentos().subscribe((deptos) => {
      // Enviamos al almacén local, lo que pintará la paleta izquierda
      this.workflowState.setDepartamentos(deptos);
    });
  }

  guardarWorkflow() {
    if (!this.engineService.isInitialized()) return;
    
    // Estructuramos el payload de acuerdo al Modelo de Spring Boot
    const payload = {
      nombre: this.workflowState.workflowNombre(),
      descripcion: this.workflowState.workflowDescripcion(),
      categoria: this.workflowState.workflowCategoria(),
      costoBase: this.workflowState.workflowCostoBase(),
      isActive: true,
      formularioCliente: this.workflowState.formularioCliente(),
      pasos: this.workflowState.pasos()
    };
    
    this.workflowService.saveWorkflow(payload).subscribe({
      next: () => {
        alert("¡Workflow guardado con éxito en MongoDB!");
      },
      error: (e) => {
        console.error("Error guardando workflow", e);
        alert("Hubo un error guardando el workflow.");
      }
    });

  }
}
