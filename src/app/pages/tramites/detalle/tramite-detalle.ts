import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsistenteFormularioResponse, TramiteService, TramiteDTO } from '../../../services/tramite.service';
import { WorkflowService, PasoGenerado, PlantillaWorkflowDTO } from '../../../services/workflow.service';
import { DepartamentoService, Departamento } from '../../../services/departamento.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { UsuarioService } from '../../../services/usuario.service';

import { TramiteTimelineComponent } from './components/tramite-timeline.component';
import { TramiteFormViewerComponent } from './components/tramite-form-viewer.component';
import { ClientDataModalComponent } from './components/client-data-modal.component';
import { VisorDocumentoModalComponent } from './components/visor-documento-modal.component';

@Component({
  selector: 'app-tramite-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, TramiteTimelineComponent, TramiteFormViewerComponent, ClientDataModalComponent, VisorDocumentoModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface-950 flex flex-col font-sans">
      <!-- Header -->
      <header class="h-14 border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-20">
        <div class="flex items-center gap-4">
          <a routerLink="/tramites" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span class="font-medium text-sm">Trámites</span>
          </a>
          <div class="h-5 w-px bg-surface-700"></div>
          <h1 class="text-sm font-semibold text-white tracking-tight">{{ tramite()?.nombrePlantilla || 'Cargando...' }}</h1>
          @if (tramite(); as t) {
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium border"
              [class.bg-amber-500/10]="t.estadoGlobal === 'PENDIENTE'"
              [class.text-amber-400]="t.estadoGlobal === 'PENDIENTE'"
              [class.border-amber-500/20]="t.estadoGlobal === 'PENDIENTE'"
              [class.bg-blue-500/10]="t.estadoGlobal === 'EN_PROGRESO'"
              [class.text-blue-400]="t.estadoGlobal === 'EN_PROGRESO'"
              [class.border-blue-500/20]="t.estadoGlobal === 'EN_PROGRESO'"
              [class.bg-emerald-500/10]="t.estadoGlobal === 'FINALIZADO'"
              [class.text-emerald-400]="t.estadoGlobal === 'FINALIZADO'"
              [class.border-emerald-500/20]="t.estadoGlobal === 'FINALIZADO'"
            >{{ t.estadoGlobal }}</span>
          }
        </div>
      </header>

      <main class="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden relative">
        @if (isLoading()) {
          <div class="flex-1 flex justify-center items-center">
            <div class="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (tramite(); as t) {
          
          <!-- Left Col: Options & Timeline -->
          <div class="w-full lg:w-96 shrink-0 overflow-y-auto lg:pr-4" style="max-height: calc(100vh - 100px)">
            
            <button (click)="openClientModal()" class="mb-6 w-full flex items-center justify-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors rounded-xl font-medium text-violet-300 text-sm">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
               Datos del Solicitante
            </button>

            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Registro de Fases</h3>
            <app-tramite-timeline
               [pasosOrdenados]="pasosOrdenados()"
               [activeStepIds]="activeStepIdsForUser()"
               [selectedStepId]="selectedStepId()"
               [tramite]="t"
               [departamentos]="departamentos()"
               (stepSelected)="selectStep($event)"
            ></app-tramite-timeline>
          </div>

          <!-- Right Col: Form Viewer -->
          <div class="flex-1 overflow-y-auto" style="max-height: calc(100vh - 100px)">
             @if (t.estadoGlobal === 'FINALIZADO' && !selectedStepId()) {
               <div class="glass rounded-2xl p-8 text-center mt-10">
                 <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                   <svg class="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                 </div>
                 <h2 class="text-xl font-bold text-white mb-2">Trámite Finalizado</h2>
                 <p class="text-sm text-gray-400">El flujo de procesos está completo. Haz clic en un paso de la izquierda para auditar sus resultados.</p>
                 @if (t.fechaFinalizacion) {
                   <p class="text-xs text-gray-500 mt-4">Finalizado: {{ formatDate(t.fechaFinalizacion) }}</p>
                 }
               </div>
             } @else if (selectedStep()) {
               <app-tramite-form-viewer
                  [tramiteId]="t.id"
                  [documentos]="t.documentos || []"
                  [step]="selectedStep()"
                  [departamentoName]="getDepartamentoNombre(selectedStep()!.departamentoId)"
                  [isReadOnly]="isSelectedStepCompleted()"
                  [canRespond]="canRespondToSelected()"
                  [formAnswers]="getSelectedStepAnswers()"
                  [isSubmitting]="isSubmitting()"
                  [isAssisting]="isAssisting()"
                  [iaPrefill]="aiPrefill()"
                  (opcionSeleccionada)="resolverDecision(selectedStep()!.id, $event)"
                  (formularioEnviado)="completarPaso(selectedStep()!.id, $event)"
                  (asistenciaSolicitada)="asistirFormulario($event)"
                  (abrirDocumento)="manejarAbrirDocumento($event)"
               ></app-tramite-form-viewer>
             } @else {
               <!-- Default empty state if En_Progreso but nothing explicitly selected and no pasoActual -->
               <div class="flex items-center justify-center h-full text-gray-500 text-sm">
                  Selecciona una etapa del menú izquierdo para analizarla...
               </div>
             }
          </div>

          <!-- Modals -->
          <app-client-data-modal
             [isOpen]="showClientModal()"
             [loading]="clientModalLoading()"
             [clientInfo]="clientInfo()"
             [initialForm]="t.datosFormularioCliente"
             [documentos]="t.documentos || []"
             (close)="showClientModal.set(false)"
          ></app-client-data-modal>

          <app-visor-documento-modal
             [isOpen]="modalDocumentoAbierto()"
             [tramiteId]="t.id"
             [campoConfig]="campoActivoParaDocumento()"
             [archivoMetadata]="metadataDocumentoActivo()"
             [formato]="campoActivoParaDocumento()?.format || 'WORD'"
             [rolUsuario]="getRolUsuarioActual()"
             [departamentoUsuario]="getDepartamentoUsuarioActual()"
             (close)="modalDocumentoAbierto.set(false)"
             (guardado)="documentoGuardado($event)"
          ></app-visor-documento-modal>

        }
      </main>
    </div>
  `
})
export class TramiteDetallePage implements OnInit {
  private readonly tramiteService = inject(TramiteService);
  private readonly workflowService = inject(WorkflowService);
  private readonly deptoService = inject(DepartamentoService);
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  tramite = signal<TramiteDTO | null>(null);
  plantilla = signal<PlantillaWorkflowDTO | null>(null);
  departamentos = signal<Departamento[]>([]);
  
  isLoading = signal(true);
  isSubmitting = signal(false);
  isAssisting = signal(false);
  aiPrefill = signal<Record<string, unknown> | null>(null);
  
  selectedStepId = signal<string | null>(null);

  // Client Modal State
  showClientModal = signal(false);
  clientModalLoading = signal(false);
  clientInfo = signal<Record<string, any> | null>(null);

  // Document Modal State
  modalDocumentoAbierto = signal(false);
  campoActivoParaDocumento = signal<any>(null);
  metadataDocumentoActivo = signal<any>(null);

  pasosOrdenados = computed(() => {
    const p = this.plantilla();
    const t = this.tramite();
    if (!p || !p.pasos) return [];
    const ordered = this.buildTraversalOrder(p.pasos, t);
    
    const user = this.authService.getUser();
    const isCliente = user?.rol === 'CLIENTE' || !user?.departamentoId;
    if (isCliente) {
      return ordered.filter(paso => !paso.departamentoId);
    }
    return ordered;
  });

  activeStepIdsForUser = computed(() => {
    const t = this.tramite();
    const user = this.authService.getUser();
    const p = this.plantilla();
    if (!t || !user || !p) return [];
    
    const activeIds = t.pasosActualesIds || [];
    const isCliente = user.rol === 'CLIENTE' || !user.departamentoId;
    if (isCliente) {
      return activeIds.filter(id => {
        const step = p.pasos.find(x => x.id === id);
        return step && !step.departamentoId;
      });
    }
    return activeIds;
  });

  selectedStep = computed(() => {
    const p = this.plantilla();
    const sid = this.selectedStepId();
    if (!p || !sid) return null;
    return p.pasos.find(x => x.id === sid) || null;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTramite(id);
    }
    this.deptoService.getDepartamentos().subscribe(d => this.departamentos.set(d));
  }

  private loadTramite(id: string) {
    this.isLoading.set(true);
    this.tramiteService.getById(id).subscribe({
      next: (t) => {
        this.tramite.set(t);
        
        this.workflowService.getWorkflowById(t.plantillaId).subscribe({
          next: (p) => { 
            this.plantilla.set(p); 
            this.isLoading.set(false); 
            
            // Set selected step intelligently
            if (t.pasosActualesIds && t.pasosActualesIds.length > 0) {
              const user = this.authService.getUser();
              const isCliente = user?.rol === 'CLIENTE' || !user?.departamentoId;
              if (isCliente) {
                const clientActiveStep = t.pasosActualesIds.find(stepId => {
                  const step = p.pasos.find(x => x.id === stepId);
                  return step && !step.departamentoId;
                });
                this.selectedStepId.set(clientActiveStep || null);
              } else {
                const deptoActiveStep = t.pasosActualesIds.find(stepId => {
                  const step = p.pasos.find(x => x.id === stepId);
                  return step && step.departamentoId === user?.departamentoId;
                });
                this.selectedStepId.set(deptoActiveStep || t.pasosActualesIds[0]);
              }
            }
          },
          error: () => { this.toast.error('Error cargando la plantilla.'); this.isLoading.set(false); }
        });
      },
      error: () => { this.toast.error('Trámite no encontrado.'); this.router.navigate(['/tramites']); }
    });
  }

  selectStep(pasoId: string) {
    this.selectedStepId.set(pasoId);
    this.aiPrefill.set(null);
  }

  isSelectedStepCompleted(): boolean {
    const t = this.tramite();
    const sId = this.selectedStepId();
    if (!t || !t.respuestas || !sId) return false;
    return !!t.respuestas[sId];
  }

  getSelectedStepAnswers(): Record<string, any> {
    const t = this.tramite();
    const sId = this.selectedStepId();
    if (!t || !t.respuestas || !sId) return {};
    return t.respuestas[sId] || {};
  }

  canRespondToSelected(): boolean {
    const user = this.authService.getUser();
    const paso = this.selectedStep();
    const t = this.tramite();
    
    if (!user || !paso || !t) return false;
    if (this.isSelectedStepCompleted()) return false;
    if (!t.pasosActualesIds || !t.pasosActualesIds.includes(paso.id)) return false; // Only respond to active steps
    
    if (!paso.departamentoId) {
      return user.id === t.clienteId;
    }
    if (!user.departamentoId) return false; // Not a worker
    return user.departamentoId === paso.departamentoId;
  }

  getDepartamentoNombre(deptoId: string | null | undefined): string {
    if (!deptoId) return '👤 Cliente';
    const depto = this.departamentos().find(d => d.id === deptoId);
    return depto ? depto.nombre : deptoId;
  }

  openClientModal() {
    this.showClientModal.set(true);
    const t = this.tramite();
    if (!t || !t.clienteId) return;

    if (!this.clientInfo()) {
       this.clientModalLoading.set(true);
       this.usuarioService.getUsuarioById(t.clienteId).subscribe({
          next: (u) => { 
             this.clientInfo.set(u); 
             this.clientModalLoading.set(false); 
          },
          error: () => { 
             this.clientModalLoading.set(false);
          }
       });
    }
  }

  completarPaso(pasoId: string, formData: Record<string, any>) {
    const t = this.tramite();
    if (!t) return;
    
    this.isSubmitting.set(true);
    this.tramiteService.responderPaso(t.id, {
      pasoId,
      respuesta: { ...formData }
    }).subscribe({
      next: (updated) => {
        this.tramite.set(updated);
         // move selected step ahead
         if (updated.pasosActualesIds && updated.pasosActualesIds.length > 0) {
           const user = this.authService.getUser();
           const isCliente = user?.rol === 'CLIENTE' || !user?.departamentoId;
           const myActiveStep = updated.pasosActualesIds.find(id => {
             const p = this.plantilla()?.pasos.find(x => x.id === id);
             if (!p) return false;
             if (isCliente) {
               return !p.departamentoId;
             } else {
               return p.departamentoId === user?.departamentoId;
             }
           });
           this.selectedStepId.set(myActiveStep || (isCliente ? null : updated.pasosActualesIds[0]));
         }
        else this.selectedStepId.set(null); // finalizado
        this.aiPrefill.set(null);

        this.isSubmitting.set(false);
        if (updated.estadoGlobal === 'FINALIZADO') {
          this.toast.success('¡Trámite finalizado exitosamente!');
        } else {
          this.toast.success('Paso completado. Avanzando al siguiente.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.error || 'Error completando el paso.');
      }
    });
  }

  resolverDecision(pasoId: string, opcion: string) {
    const t = this.tramite();
    if (!t) return;
    
    this.isSubmitting.set(true);
    this.tramiteService.responderPaso(t.id, {
      pasoId,
      decisionElegida: opcion
    }).subscribe({
      next: (updated) => {
        this.tramite.set(updated);
         if (updated.pasosActualesIds && updated.pasosActualesIds.length > 0) {
           const user = this.authService.getUser();
           const isCliente = user?.rol === 'CLIENTE' || !user?.departamentoId;
           const myActiveStep = updated.pasosActualesIds.find(id => {
             const p = this.plantilla()?.pasos.find(x => x.id === id);
             if (!p) return false;
             if (isCliente) {
               return !p.departamentoId;
             } else {
               return p.departamentoId === user?.departamentoId;
             }
           });
           this.selectedStepId.set(myActiveStep || (isCliente ? null : updated.pasosActualesIds[0]));
         }
        else this.selectedStepId.set(null); // finalizado
        this.aiPrefill.set(null);

        this.isSubmitting.set(false);
        this.toast.success(`Decisión "${opcion}" tomada.`);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.error || 'Error procesando la decisión.');
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  }

  asistirFormulario(event: { modo: 'chat' | 'voz'; mensaje: string }) {
    const tramite = this.tramite();
    const paso = this.selectedStep();
    if (!tramite || !paso) {
      return;
    }

    if (event.mensaje === 'VOICE_UNSUPPORTED') {
      this.toast.error('Tu navegador no soporta reconocimiento de voz para esta función.');
      return;
    }

    if (event.mensaje.startsWith('VOICE_ERROR:')) {
      const code = event.mensaje.replace('VOICE_ERROR:', '');
      this.toast.error(`Error de voz (${code}). Revisa permisos de micrófono y vuelve a intentar.`);
      return;
    }

    this.isAssisting.set(true);
    this.tramiteService
      .asistirFormulario(tramite.id, {
        pasoId: paso.id,
        modo: event.modo,
        mensaje: event.mensaje
      })
      .subscribe({
        next: (response: AsistenteFormularioResponse) => {
          this.aiPrefill.set(response.sugerencia ?? {});
          this.isAssisting.set(false);

          if (response.observacion) {
            this.toast.success(response.observacion);
          } else if (!response.sugerencia || Object.keys(response.sugerencia).length === 0) {
            this.toast.error('IA no pudo inferir campos con ese mensaje. Intenta con más detalle.');
          } else {
            this.toast.success('Formulario autocompletado con sugerencias de IA.');
          }
        },
        error: (err: unknown) => {
          this.isAssisting.set(false);
          const msg =
            typeof err === 'object' && err !== null && 'error' in err
              ? (err as { error?: { error?: string } }).error?.error
              : null;
          this.toast.error(msg || 'No se pudo obtener sugerencias de IA para este paso.');
        }
      });
  }

  private buildTraversalOrder(pasos: PasoGenerado[], tramite: TramiteDTO | null): PasoGenerado[] {
    if (!pasos || pasos.length === 0) return [];
    const pasosMap = new Map<string, PasoGenerado>();
    pasos.forEach(p => { if (p && p.id) pasosMap.set(p.id, p); });
    
    const result: PasoGenerado[] = [];
    const visited = new Set<string>();
    const queue: string[] = [pasos[0].id];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      
      const paso = pasosMap.get(currentId);
      if (!paso) continue;
      
      visited.add(currentId);
      result.push(paso);
      
      const sig = paso.siguientes;
      const respuestas = tramite?.respuestas || {};
      
      if (respuestas[currentId]) {
        const resp: Record<string, any> = respuestas[currentId];
        if (paso.tipo === 'DECISION' && resp['decision']) {
          const nextId = sig?.[resp['decision'] as string];
          if (nextId) queue.push(nextId);
        } else if (sig) {
          Object.values(sig).forEach(nextId => {
            if (nextId) queue.push(nextId);
          });
        }
      } else if (tramite?.pasosActualesIds && tramite.pasosActualesIds.includes(currentId)) {
        if (sig) {
          Object.values(sig).forEach(nextId => {
            if (nextId) queue.push(nextId);
          });
        }
      } else {
        if (sig) {
          Object.values(sig).forEach(nextId => {
            if (nextId) queue.push(nextId);
          });
        }
      }
    }
    
    if (tramite?.pasosActualesIds) {
      tramite.pasosActualesIds.forEach(id => {
        if (!visited.has(id)) {
          const paso = pasosMap.get(id);
          if (paso) {
            result.push(paso);
            visited.add(id);
          }
        }
      });
    }

    result.sort((a, b) => {
      const idxA = pasos.findIndex(x => x.id === a.id);
      const idxB = pasos.findIndex(x => x.id === b.id);
      return idxA - idxB;
    });
    
    return result;
  }

  getRolUsuarioActual(): string {
    const user = this.authService.getUser();
    return user ? user.rol : '';
  }

  getDepartamentoUsuarioActual(): string {
    const user = this.authService.getUser();
    return user && user.departamentoId ? user.departamentoId : '';
  }

  manejarAbrirDocumento(event: {key: string, type: string, format: string, permisos: any}) {
    const t = this.tramite();
    if (!t) return;
    this.isSubmitting.set(true);
    
    this.tramiteService.inicializarDocumento(t.id, event.key, event.format, event.permisos).subscribe({
      next: (metadata) => {
        this.isSubmitting.set(false);
        this.campoActivoParaDocumento.set(event);
        this.metadataDocumentoActivo.set(metadata);
        this.modalDocumentoAbierto.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.error || 'Error inicializando el documento.');
      }
    });
  }

  documentoGuardado(metadata: any) {
    this.toast.success('Documento guardado exitosamente en S3.');
    // Actualizamos silenciosamente el trámite actual en memoria para que el formulario sepa que el documento existe
    const t = this.tramite();
    if (t) {
      const idx = t.documentos?.findIndex((d: any) => d.archivoId === metadata.archivoId);
      if (idx !== undefined && idx >= 0 && t.documentos) {
        t.documentos[idx] = metadata;
      } else {
        if (!t.documentos) t.documentos = [];
        t.documentos.push(metadata);
      }
      this.tramite.set({...t});
    }
  }
}
