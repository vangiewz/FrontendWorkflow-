import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { WorkflowStateService } from '../../services/workflow-state.service';
import { WorkflowService } from '../../../../services/workflow.service';
import { AuthService } from '../../../../services/auth.service';
import { ButtonComponent } from '../../../../shared/button/button';
import { JsonFormBuilderComponent } from '../json-form-builder/json-form-builder';
import { WorkflowAiAssistantComponent } from '../workflow-ai-assistant/workflow-ai-assistant';
import { ToastService } from '../../../../shared/toast/toast.service';
import { DialogService } from '../../../../shared/dialog/dialog.service';
import { PasoGenerado } from '../../../../services/workflow.service';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type BrowserSpeechWindow = Window & {
  webkitSpeechRecognition?: SpeechRecognitionCtor;
  SpeechRecognition?: SpeechRecognitionCtor;
};

interface WorkflowGenerationResponse {
  nombreTramite?: string;
  descripcionTramite?: string;
  categoria?: 'INTERNO' | 'EXTERNO' | string;
  costoBase?: number;
  formularioCliente?: Record<string, unknown>;
  pasos?: PasoGenerado[];
}

@Component({
  selector: 'app-ai-chat-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, JsonFormBuilderComponent, WorkflowAiAssistantComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="h-full absolute md:relative right-0 top-0 bottom-0 border-l border-surface-800 bg-surface-900 shadow-2xl md:shadow-none md:bg-surface-900/50 flex flex-col z-30 shrink-0 transition-all duration-300 ease-in-out"
      [style.width]="workflowState.isChatExpanded() ? 'min(100vw, 380px)' : '0px'"
      [style.borderLeftWidth]="workflowState.isChatExpanded() ? '1px' : '0px'"
      [style.overflow]="'hidden'"
    >
      <div class="p-4 flex flex-col w-[min(100vw,380px)] h-full min-h-0 gap-5">
        
        <!-- Header con TABS -->
        <div class="flex justify-between items-center mb-2">
          <div class="flex gap-3">
            <button (click)="activeTab.set('chat'); workflowState.selectPaso(null)" 
                    [class.text-emerald-400]="activeTab() === 'chat'" 
                    class="text-xs font-semibold uppercase tracking-wider transition-colors"
                    [class.text-gray-500]="activeTab() !== 'chat'">
              Chat IA
            </button>
            <span class="text-surface-700">|</span>
            <button (click)="activeTab.set('propiedades')" 
                    [class.text-emerald-400]="activeTab() === 'propiedades'" 
                    class="text-xs font-semibold uppercase tracking-wider transition-colors"
                    [class.text-gray-500]="activeTab() !== 'propiedades'">
              Propiedades
            </button>
          </div>
          <button (click)="workflowState.toggleChat()" class="text-gray-400 hover:text-white">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <!-- Tab: Chat Inteligente -->
        <div class="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1" [class.hidden]="activeTab() !== 'chat'">
          <label class="text-xs text-gray-400">Describe la política del trámite</label>
          <textarea 
            [formControl]="promptCtrl"
            rows="3"
            class="w-full min-h-24 shrink-0 rounded-lg border border-surface-700 bg-surface-800 p-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Ej. Trámite de vacaciones. Pasa por RRHH y luego a Gerencia..."
          ></textarea>

          <div class="flex items-center gap-2">
            <app-button variant="primary" size="sm" class="flex-1" (click)="generarConIA()" [disabled]="isGenerating() || !promptCtrl.value || isPromptListening()">
              {{ isGenerating() ? 'Generando...' : 'Generar Diagrama' }}
            </app-button>
            <app-button variant="outline" size="sm" (click)="togglePromptVoiceInput()" [disabled]="!voiceInputSupported() || isGenerating()">
              {{ isPromptListening() ? 'Detener Voz' : 'Hablar' }}
            </app-button>
          </div>

          <div class="rounded-lg border border-surface-700 bg-surface-950/50 px-3 py-2">
            @if (isPromptListening()) {
              <p class="text-[11px] text-red-300 flex items-center gap-2">
                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse"></span>
                Grabando prompt por voz...
              </p>
            } @else if (isGenerating()) {
              <p class="text-[11px] text-emerald-300 flex items-center gap-2">
                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Procesando y generando diagrama...
              </p>
            } @else if (isPromptVoiceProcessing()) {
              <p class="text-[11px] text-sky-300 flex items-center gap-2">
                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                Transcripción completada. Enviando prompt...
              </p>
            } @else {
              <p class="text-[11px] text-gray-400">
                Puedes escribir o hablar. Si usas voz, al terminar se genera automáticamente.
              </p>
            }
          </div>

          <app-workflow-ai-assistant></app-workflow-ai-assistant>
        </div>

        <!-- Tab: Propiedades del Nodo Seleccionado -->
        <div class="flex flex-col gap-3 flex-1 overflow-y-auto" [class.hidden]="activeTab() !== 'propiedades'">
          @if (workflowState.selectedPaso(); as paso) {
            <label class="text-xs text-gray-400">Nombre de la Actividad</label>
            <input 
              [formControl]="editNombreCtrl"
              type="text" 
              class="w-full bg-surface-800 border border-surface-700 rounded-lg p-2 text-sm text-gray-200 transition-all"
              [class.opacity-60]="paso.isCustom"
              [class.cursor-not-allowed]="paso.isCustom"
              [readonly]="paso.isCustom"
            >

            @if (!paso.isCustom) {
               <label class="text-xs text-gray-400 mt-3 block">Asignado a (Departamento / Cliente)</label>
               <select [formControl]="editDeptoCtrl" class="w-full bg-surface-800 border border-surface-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all mt-1 appearance-none mb-4">
                  <option value="null">Cliente (Usuario Externo)</option>
                  @for (depto of workflowState.departamentos(); track depto.id) {
                     <option [value]="depto.id">{{ depto.nombre }}</option>
                  }
               </select>
            }

            @if (paso.tipo === 'DECISION') {
              <div class="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p class="text-xs font-semibold text-amber-500 mb-2">Nodo de Decisión</p>
                <p class="text-[10px] text-gray-400 mb-3">Las rutas se definen al conectar flechas. Doble clic en una flecha para editar su nombre o eliminarla.</p>
                
                @if (paso.siguientes && getObjectKeys(paso.siguientes).length > 0) {
                  <div class="space-y-2 mt-3">
                    <p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Rutas configuradas</p>
                    @for (key of getObjectKeys(paso.siguientes); track key) {
                      <div class="flex items-center gap-2 bg-surface-800/50 rounded-lg px-3 py-2">
                        <div class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                        <span class="text-xs text-amber-300 font-medium flex-1 truncate">{{ key }}</span>
                        <svg class="w-3 h-3 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                        <span class="text-[10px] text-gray-400 truncate">{{ paso.siguientes[key] }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-[10px] text-gray-500 mt-2 italic">Sin rutas. Active el modo Flechas y conecte este nodo a otros pasos.</p>
                }
              </div>
              <app-button variant="primary" size="sm" class="w-full mt-4" (click)="guardarPropiedades()">
                Guardar Propiedades
              </app-button>
            } @else if (paso.tipo === 'FORK' || paso.tipo === 'JOIN') {
              <div class="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                <p class="text-xs font-semibold text-sky-500 mb-2">Nodo {{ paso.tipo }}</p>
                <p class="text-[10px] text-gray-400 mb-3">Este nodo gestiona flujos paralelos y no requiere formulario.</p>
                
                @if (paso.tipo === 'FORK' && paso.siguientes && getObjectKeys(paso.siguientes).length > 0) {
                  <div class="space-y-2 mt-3">
                    <p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Rutas configuradas</p>
                    @for (key of getObjectKeys(paso.siguientes); track key) {
                      <div class="flex items-center gap-2 bg-surface-800/50 rounded-lg px-3 py-2">
                        <div class="w-2 h-2 rounded-full bg-sky-500 shrink-0"></div>
                        <span class="text-xs text-sky-300 font-medium flex-1 truncate">{{ key }}</span>
                        <svg class="w-3 h-3 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                        <span class="text-[10px] text-gray-400 truncate">{{ paso.siguientes[key] }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
              <app-button variant="primary" size="sm" class="w-full mt-4" (click)="guardarPropiedades()">
                Guardar Propiedades
              </app-button>
            } @else if (paso.nombrePaso !== 'Notificación recibida') {
              <div class="mt-2 py-4 border-t border-surface-800">
                 <h3 class="text-xs font-semibold text-emerald-400 mb-1">Formulario del Departamento</h3>
                 <p class="text-[10px] text-gray-400 mb-3">Define los datos requeridos para que este paso sea validado o completado.</p>
                 
                 <app-json-form-builder 
                    [schema]="editFormCtrl.value" 
                    (schemaChange)="editFormCtrl.setValue($event)">
                 </app-json-form-builder>
              </div>

              <app-button variant="primary" size="sm" class="w-full mt-4" (click)="guardarPropiedades()">
                Guardar Propiedades
              </app-button>
            } @else {
              <div class="mt-4 p-4 text-center bg-surface-800 border border-surface-700 rounded-lg">
                <p class="text-xs text-gray-400">Este es el fin de la ruta visual. No requiere formulario de entrada.</p>
              </div>
            }

            @if (!paso.isCustom) {
              <div class="flex gap-2 w-full mt-2">
                <button class="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 p-2 rounded flex-1 flex justify-center items-center transition-colors" (click)="eliminarPaso()" title="Eliminar actividad">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            }
          } @else {
            <!-- Global Workflow Metadata -->
            <label class="text-xs text-gray-400">Nombre de la Política de Negocio</label>
            <input 
              [formControl]="globalNombreCtrl"
              type="text" 
              class="w-full bg-surface-800 border border-surface-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all mb-2"
              placeholder="Ej. Solicitud de Vacaciones"
            >

            <label class="text-xs text-gray-400">Descripción del Trámite</label>
            <input 
              [formControl]="globalDescCtrl"
              type="text"
              class="w-full bg-surface-800 border border-surface-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all mb-2"
              placeholder="Breve descripción del alcance..."
            >

            <div class="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label class="text-xs text-gray-400">Categoría</label>
                <select
                    [formControl]="globalCategoriaCtrl"
                    class="w-full bg-surface-800 border border-surface-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all mt-1 appearance-none">
                    <option value="INTERNO">Interno</option>
                    <option value="EXTERNO">Externo</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-400">Costo Inicial</label>
                <input 
                    [formControl]="globalCostoBaseCtrl"
                    type="number"
                    min="0"
                  step="1"
                    class="w-full bg-surface-800 border border-surface-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all mt-1"
                    [title]="globalCategoriaCtrl.value === 'INTERNO' ? 'Trámites internos asumen costo 0 por defecto, pero puede ajustarse.' : 'Costo del trámite externo.'"
                >
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-surface-800">
               <h3 class="text-xs font-semibold text-emerald-400 mb-1">Formulario Inicial del Cliente</h3>
               <p class="text-[10px] text-gray-400 mb-3">Estos son los datos iniciales que el ciudadano/cliente deberá proporcionar para arrancar el trámite.</p>
               
               <app-json-form-builder 
                  [schema]="globalFormClienteCtrl.value" 
                  (schemaChange)="globalFormClienteCtrl.setValue($event)">
               </app-json-form-builder>
            </div>

            <app-button variant="primary" size="sm" class="w-full mt-6 mb-4" (click)="guardarMetadataGlobal()">
              Actualizar Metadatos
            </app-button>

            <div class="flex-1 flex flex-col items-center justify-center text-center opacity-50 p-4 mt-4">
              <svg class="w-10 h-10 mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
              </svg>
              <p class="text-xs text-gray-300 tracking-wide">Haz doble clic en un nodo visual para editar sus pasos específicos.</p>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class AiChatSidebarComponent implements OnDestroy {
  workflowState = inject(WorkflowStateService);
  private workflowService = inject(WorkflowService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  
  // TABS State
  activeTab = signal<'chat' | 'propiedades'>('chat');

  // Chat Form
  promptCtrl = this.fb.control('');
  isGenerating = signal(false);
  isPromptListening = signal(false);
  isPromptVoiceProcessing = signal(false);
  voiceInputSupported = signal(false);

  // Edit Forms
  editNombreCtrl = this.fb.control('');
  editDeptoCtrl = this.fb.control<string>('null');
  editFormCtrl = this.fb.control<any>({});

  // Global Config form
  globalNombreCtrl = this.fb.control('');
  globalDescCtrl = this.fb.control('');
  globalCategoriaCtrl = this.fb.control('INTERNO');
  globalCostoBaseCtrl = this.fb.control(0);
  globalFormClienteCtrl = this.fb.control<Record<string, unknown>>({});

  private promptRecognition: SpeechRecognitionLike | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const browserWindow = window as BrowserSpeechWindow;
      this.voiceInputSupported.set(Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition));
    }

    // Si la categoría cambia a INTERNO, entonces resetea el costo base a 0
    this.globalCategoriaCtrl.valueChanges.subscribe((val) => {
      if (val === 'INTERNO') {
        this.globalCostoBaseCtrl.setValue(0);
      }
    });

    effect(() => {
      // Reaccionar cuando se selecciona un paso del jointjs
      const selected = this.workflowState.selectedPaso();
      if (selected) {
        this.activeTab.set('propiedades');
        this.editNombreCtrl.setValue(selected.nombrePaso);
        this.editDeptoCtrl.setValue(String(selected.departamentoId || 'null'));
        this.editFormCtrl.setValue(selected.formularioJson || {});
      } else {
        // Populate global config
        this.globalNombreCtrl.setValue(this.workflowState.workflowNombre());
        this.globalDescCtrl.setValue(this.workflowState.workflowDescripcion());
        this.globalCategoriaCtrl.setValue(this.workflowState.workflowCategoria(), { emitEvent: false });
        this.globalCostoBaseCtrl.setValue(this.workflowState.workflowCostoBase());
        this.globalFormClienteCtrl.setValue(this.workflowState.formularioCliente() || {});
      }
    });
  }

  ngOnDestroy() {
    this.promptRecognition?.stop();
  }

  guardarMetadataGlobal() {
    try {
      const parsedForm = this.globalFormClienteCtrl.value || {};
      const n = this.globalNombreCtrl.value || 'Nuevo Trámite';
      const d = this.globalDescCtrl.value || '';
      const c = this.globalCategoriaCtrl.value || 'INTERNO';
      const costo = Math.max(0, Number(this.globalCostoBaseCtrl.value) || 0);
      this.globalCostoBaseCtrl.setValue(costo, { emitEvent: false });
      
      this.workflowState.setWorkflowMetadata(n, d, c, costo);
      this.workflowState.setFormularioCliente(parsedForm);
      
      this.toast.success('Metadatos globales y formulario del cliente actualizados.');
    } catch (e) {
      this.toast.error('Error guardando metadatos.');
    }
  }

  guardarPropiedades() {
    const selected = this.workflowState.selectedPaso();
    if (!selected) return;

    try {
      const updatedForm = this.editFormCtrl.value || {};

      // Caso Especial: Formulario inamovible de Cliente Global
      if ((selected as any).isCustom) {
        if (selected.nombrePaso === 'Inicio de proceso') {
           this.workflowState.setFormularioCliente(updatedForm);
           const copy = [...this.workflowState.pasos()];
           this.workflowState.setPasos(copy); // Truco para forzar redibujado
           this.workflowState.selectPaso(null);
           this.toast.success("Formulario base del Cliente actualizado exitosamente.");
        }
        return;
      }

      // Caso Normal: Actividades Dinámicas
      const updatedNombre = this.editNombreCtrl.value || selected.nombrePaso;
      const updatedDepto = this.editDeptoCtrl.value === 'null' ? null : this.editDeptoCtrl.value;
      const pasos = [...this.workflowState.pasos()];
      const index = pasos.findIndex(p => p.id === (selected as any).id);
      if (index !== -1) {
        const isDesc = selected.tipo === 'DECISION' || selected.tipo === 'FORK' || selected.tipo === 'JOIN';
        pasos[index] = { ...pasos[index], nombrePaso: updatedNombre, departamentoId: updatedDepto, formularioJson: isDesc ? null : updatedForm };
        // Trigger visual engine rebuild by updating state
        this.workflowState.setPasos(pasos);
        // Clear selection to avoid loops
        this.workflowState.selectPaso(null);
      }
    } catch (e) {
      this.toast.error('Error guardando el formulario.');
    }
  }
  eliminarPaso() {
    const selected = this.workflowState.selectedPaso();
    if (!selected) return;
    
    this.dialogService.confirm(
      'Eliminar Actividad',
      `¿Estás seguro de que deseas eliminar "${selected.nombrePaso}"?`,
      true,
      'Eliminar'
    ).subscribe(confirmDelete => {
      if (confirmDelete) {
        let pasos = [...this.workflowState.pasos()];
        // Remove the step
        pasos = pasos.filter(p => p.id !== selected.id);
        
        // Remove trailing references in other steps' "siguientes" map
        pasos.forEach(p => {
            if (p.siguientes) {
                Object.keys(p.siguientes).forEach(k => {
                    if (p.siguientes[k] === selected.id) {
                        delete p.siguientes[k];
                    }
                });
            }
        });
        
        this.workflowState.selectPaso(null);
        this.workflowState.setPasos(pasos); // Desencadena redibujado visual
        this.activeTab.set('chat');
      }
    });
  }


  getObjectKeys(obj: Record<string, any>): string[] {
    return obj ? Object.keys(obj) : [];
  }

  generarConIA() {
    const prompt = (this.promptCtrl.value ?? '').trim();
    if (!prompt) return;

    const user = this.authService.getUser();
    if (!user || user.rol !== 'ADMIN') {
      this.toast.error('Solo un usuario ADMIN puede generar diagramas con IA.');
      return;
    }
    
    this.isGenerating.set(true);

    // Conexión real hacia el backend (ClaudeAiService en Spring Boot)
    this.workflowService.generateWithAi(prompt).subscribe({
      next: (jsonString) => {
        try {
          const parsed = this.parseGeneratedWorkflow(jsonString);
          if (parsed && Array.isArray(parsed.pasos)) {
            const deptosReales = this.workflowState.departamentos();
            // Mapeo seguro de nombres devueltos por IA a verdaderos IDs
            parsed.pasos.forEach((p) => {
              if (p.departamentoId && p.departamentoId !== 'Cliente') {
                const found = deptosReales.find(d => d.nombre.toLowerCase() === String(p.departamentoId).toLowerCase());
                if (found) {
                  p.departamentoId = found.id;
                }
              }
            });

            // Actualizamos la tienda global y desencadena el renderizado en JointJS
            this.workflowState.setPasos(parsed.pasos);
            
            // Actualizamos metadatos globales si Claude los proveyó
            if (parsed.nombreTramite || parsed.descripcionTramite || parsed.categoria) {
              const cat = parsed.categoria || 'EXTERNO';
              const costo = cat === 'INTERNO' ? 0 : (Number(parsed.costoBase) || 0);
              this.workflowState.setWorkflowMetadata(
                  parsed.nombreTramite || 'Nuevo Trámite', 
                  parsed.descripcionTramite || '',
                  cat,
                  costo
              );
            }
            if (parsed.formularioCliente) {
              this.workflowState.setFormularioCliente(parsed.formularioCliente);
            }
            
            // Hacemos que se visualice la pestaña de propiedades globales para que el usuario las corrobore
            this.workflowState.selectPaso(null);
            this.activeTab.set('propiedades');
          }
        } catch (e) {
          console.error('Error parseando respuesta IA de Spring Boot', e);
          this.toast.error('Claude devolvió una respuesta incompleta o inválida. Intenta de nuevo.');
        }
        this.isGenerating.set(false);
      },
      error: (e) => {
        console.error(e);
        this.isGenerating.set(false);
        const errorMessage = this.extractApiErrorMessage(e);
        this.toast.error(errorMessage);
      }
    });
  }

  togglePromptVoiceInput() {
    if (!this.voiceInputSupported()) {
      this.toast.error('Reconocimiento de voz no disponible en este navegador.');
      return;
    }

    if (this.isPromptListening()) {
      this.promptRecognition?.stop();
      this.isPromptListening.set(false);
      return;
    }

    this.startPromptVoiceInput();
  }

  private startPromptVoiceInput() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const browserWindow = window as BrowserSpeechWindow;
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    this.promptRecognition = new Recognition();
    this.promptRecognition.lang = 'es-ES';
    this.promptRecognition.interimResults = false;
    this.promptRecognition.continuous = false;

    this.promptRecognition.onresult = (event) => {
      const firstResult = event.results[0];
      const transcript = firstResult && firstResult[0] ? firstResult[0].transcript.trim() : '';
      if (transcript.length > 0) {
        this.promptCtrl.setValue(transcript);
        this.isPromptVoiceProcessing.set(true);
      }
    };

    this.promptRecognition.onerror = () => {
      this.isPromptListening.set(false);
      this.isPromptVoiceProcessing.set(false);
      this.toast.error('No se pudo capturar el audio del prompt.');
    };

    this.promptRecognition.onend = () => {
      const shouldGenerate = this.isPromptVoiceProcessing() && !!(this.promptCtrl.value ?? '').trim();
      this.isPromptListening.set(false);
      if (shouldGenerate) {
        this.generarConIA();
      }
      this.isPromptVoiceProcessing.set(false);
    };

    this.promptRecognition.start();
    this.isPromptListening.set(true);
  }

  private parseGeneratedWorkflow(rawResponse: string): WorkflowGenerationResponse {
    const normalized = this.extractFirstJsonObject(rawResponse);
    if (!normalized) {
      throw new Error('No se pudo extraer un objeto JSON válido de la respuesta IA.');
    }

    const parsedUnknown: unknown = JSON.parse(normalized);
    if (!this.isWorkflowGenerationResponse(parsedUnknown)) {
      throw new Error('La respuesta IA no tiene la estructura mínima esperada.');
    }

    return parsedUnknown;
  }

  private isWorkflowGenerationResponse(value: unknown): value is WorkflowGenerationResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const objectValue = value as Record<string, unknown>;
    return Array.isArray(objectValue['pasos']);
  }

  private extractFirstJsonObject(rawResponse: string): string | null {
    if (!rawResponse || !rawResponse.trim()) {
      return null;
    }

    let content = rawResponse.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    const start = content.indexOf('{');
    if (start < 0) {
      return null;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < content.length; index += 1) {
      const char = content[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          return content.slice(start, index + 1);
        }
      }
    }

    return null;
  }

  private extractApiErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return 'Fallo de comunicación con la API.';
    }

    const err = error as { status?: number; error?: unknown; message?: string };

    if (err.status === 403) {
      return 'No tienes permisos para esta acción. Verifica que tu sesión esté activa e intenta cerrar e iniciar sesión nuevamente.';
    }

    if (err.status === 400) {
      const detail = this.extractServerErrorField(err.error);
      if (detail) {
        return `No se pudo generar el workflow: ${detail}`;
      }
      return 'No se pudo generar el workflow. El backend recibió una respuesta IA inválida.';
    }

    return err.message || 'Fallo de comunicación con la API.';
  }

  private extractServerErrorField(payload: unknown): string | null {
    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      const text = payload.trim();
      try {
        const parsedUnknown: unknown = JSON.parse(text);
        if (parsedUnknown && typeof parsedUnknown === 'object') {
          const parsed = parsedUnknown as Record<string, unknown>;
          if (typeof parsed['error'] === 'string' && parsed['error'].trim()) {
            return parsed['error'].trim();
          }
        }
      } catch {
        // If not JSON, use plain text payload.
      }

      return text || null;
    }

    if (typeof payload === 'object') {
      const objectPayload = payload as Record<string, unknown>;
      if (typeof objectPayload['error'] === 'string' && objectPayload['error'].trim()) {
        return objectPayload['error'].trim();
      }
    }

    return null;
  }
}
