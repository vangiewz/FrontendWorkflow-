import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button';
import { PaletteSidebarComponent } from './components/palette-sidebar/palette-sidebar';
import { JointjsCanvasComponent } from './components/jointjs-canvas/jointjs-canvas';
import { AiChatSidebarComponent } from './components/ai-chat-sidebar/ai-chat-sidebar';
import { ToastService } from '../../shared/toast/toast.service';
import { WorkflowStateService } from './services/workflow-state.service';
import { DepartamentoService } from '../../services/departamento.service';
import { JointjsEngineService } from './services/jointjs-engine.service';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowWebsocketService } from '../../services/workflow-websocket.service';
import { AuthService } from '../../services/auth.service';

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
          <a routerLink="/workflows" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span class="font-medium text-sm">Workflows</span>
          </a>
          <div class="h-5 w-px bg-surface-700"></div>
          <h1 class="text-sm font-semibold text-white tracking-tight">
            {{ workflowState.isEditMode() ? 'Editando: ' + workflowState.workflowNombre() : 'Crear Nuevo Workflow' }}
          </h1>
          @if (workflowState.isEditMode()) {
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium border"
              [class.bg-emerald-500/10]="workflowState.isActive()"
              [class.text-emerald-400]="workflowState.isActive()"
              [class.border-emerald-500/20]="workflowState.isActive()"
              [class.bg-red-500/10]="!workflowState.isActive()"
              [class.text-red-400]="!workflowState.isActive()"
              [class.border-red-500/20]="!workflowState.isActive()"
            >
              {{ workflowState.isActive() ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          }
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Connected users indicator -->
          @if (connectedUsers().length > 0) {
            <div class="flex items-center gap-1.5 px-3 py-1 bg-surface-800 border border-surface-700 rounded-full">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-[10px] text-gray-300">{{ connectedUsers().length + 1 }} editores</span>
            </div>
          }
          @if (!workflowState.isChatExpanded()) {
            <app-button variant="outline" size="sm" (click)="workflowState.toggleChat()">
              Abrir Asistente IA
            </app-button>
          }
          <app-button variant="primary" size="sm" (click)="guardarWorkflow()" [disabled]="isSaving()">
            {{ isSaving() ? 'Guardando...' : (workflowState.isEditMode() ? 'Actualizar Workflow' : 'Guardar Workflow') }}
          </app-button>
        </div>
      </header>

      <!-- 3 Columns Layout -->
      <main class="flex-1 flex overflow-hidden relative">
        <app-palette-sidebar></app-palette-sidebar>
        <div class="flex-1 overflow-hidden relative">
          <app-jointjs-canvas></app-jointjs-canvas>
        </div>
        <app-ai-chat-sidebar></app-ai-chat-sidebar>
      </main>
    </div>
  `
})
export class WorkflowDesignerPage implements OnInit, OnDestroy {
  readonly workflowState = inject(WorkflowStateService);
  private readonly engineService = inject(JointjsEngineService);
  private readonly deptoService = inject(DepartamentoService);
  private readonly workflowService = inject(WorkflowService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly wsService = inject(WorkflowWebsocketService);
  private readonly authService = inject(AuthService);

  isSaving = signal(false);
  connectedUsers = signal<string[]>([]);
  
  private wsSub?: Subscription;
  private joinSub?: Subscription;

  ngOnInit() {
    // Cargar departamentos
    this.deptoService.getDepartamentos().subscribe((deptos) => {
      this.workflowState.setDepartamentos(deptos);
    });

    // Detectar si estamos editando un workflow existente
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadExistingWorkflow(id);
    } else {
      // New workflow (clean slate) 
      this.workflowState.resetToNew();
    }
  }

  private loadExistingWorkflow(id: string) {
    this.workflowService.getWorkflowById(id).subscribe({
      next: (dto) => {
        this.workflowState.loadFromDTO(dto);
        this.toast.success(`Workflow "${dto.nombre}" cargado para edición.`);
        
        // Conectar al WebSocket para colaboración
        this.setupCollaboration(id);
      },
      error: () => {
        this.toast.error('No se encontró el workflow solicitado.');
        this.router.navigate(['/workflows']);
      }
    });
  }

  private setupCollaboration(workflowId: string) {
    const user = this.authService.getUser();
    const userName = user?.nombre || 'Admin';
    
    this.wsService.joinRoom(workflowId, userName);
    
    // Escuchar cuando otros se unen/salen
    this.joinSub = this.wsService.joinEvents$.subscribe((event) => {
      if (event.usuarioNombre !== userName) {
        if (event.accion === 'JOIN') {
          this.connectedUsers.update(users => [...users, event.usuarioNombre]);
          this.toast.success(`${event.usuarioNombre} se ha unido a la edición.`);
        }
      }
    });

    // Escuchar sync de estado completo de otros admins
    this.wsSub = this.wsService.syncEvents$.subscribe((syncData) => {
      // Solo aplicar si no fue enviado por nosotros mismos
      if (syncData.usuarioNombre !== userName) {
        this.workflowState.applyRemoteSync(syncData);
      }
    });
  }

  guardarWorkflow() {
    if (!this.engineService.isInitialized()) return;
    
    const payload = {
      nombre: this.workflowState.workflowNombre(),
      descripcion: this.workflowState.workflowDescripcion(),
      categoria: this.workflowState.workflowCategoria(),
      costoBase: this.workflowState.workflowCostoBase(),
      isActive: this.workflowState.isActive(),
      formularioCliente: this.workflowState.formularioCliente(),
      pasos: this.workflowState.pasos()
    };
    
    this.isSaving.set(true);

    const wfId = this.workflowState.workflowId();

    if (wfId) {
      // UPDATE existing
      this.workflowService.updateWorkflow(wfId, payload).subscribe({
        next: (saved) => {
          this.isSaving.set(false);
          this.toast.success("¡Workflow actualizado con éxito!");
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error("Error actualizando el workflow.");
          console.error(err);
        }
      });
    } else {
      // CREATE new
      this.workflowService.saveWorkflow(payload).subscribe({
        next: (saved) => {
          this.isSaving.set(false);
          this.toast.success("¡Workflow creado con éxito!");
          // Navigate to edit mode with the new ID
          if (saved.id) {
            this.router.navigate(['/designer', saved.id]);
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error("Hubo un error guardando el workflow.");
          console.error(err);
        }
      });
    }
  }

  ngOnDestroy() {
    this.wsSub?.unsubscribe();
    this.joinSub?.unsubscribe();
    this.wsService.leaveRoom();
  }
}
