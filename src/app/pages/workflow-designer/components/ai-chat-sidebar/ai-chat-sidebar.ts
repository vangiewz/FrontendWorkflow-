import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { WorkflowStateService } from '../../services/workflow-state.service';
import { WorkflowService } from '../../../../services/workflow.service';
import { ButtonComponent } from '../../../../shared/button/button';
import { JsonFormBuilderComponent } from '../json-form-builder/json-form-builder';
import { ToastService } from '../../../../shared/toast/toast.service';
import { DialogService } from '../../../../shared/dialog/dialog.service';

@Component({
  selector: 'app-ai-chat-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, JsonFormBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="h-full border-l border-surface-800 bg-surface-900/50 flex flex-col z-10 shrink-0 transition-all duration-300 ease-in-out"
      [style.width]="workflowState.isChatExpanded() ? '320px' : '0px'"
      [style.borderLeftWidth]="workflowState.isChatExpanded() ? '1px' : '0px'"
      [style.overflow]="'hidden'"
    >
      <div class="p-4 flex flex-col w-[320px] h-full gap-5">
        
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
        <div class="flex flex-col gap-3" [class.hidden]="activeTab() !== 'chat'">
          <label class="text-xs text-gray-400">Describe la política del trámite</label>
          <textarea 
            [formControl]="promptCtrl"
            rows="6"
            class="w-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
            placeholder="Ej. Trámite de vacaciones. Pasa por RRHH y luego a Gerencia..."
          ></textarea>
          <app-button variant="primary" size="sm" class="w-full" (click)="generarConIA()" [disabled]="isGenerating() || !promptCtrl.value">
            {{ isGenerating() ? 'Generando...' : 'Generar Diagrama con IA' }}
          </app-button>
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
              <div class="mt-4 p-4 text-center bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p class="text-xs font-semibold text-amber-500">Nodo de Decisión Condicional</p>
                <p class="text-[10px] text-gray-400 mt-2">No recibe formulario de entrada porque deduce la condición en base al paso anterior.</p>
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
export class AiChatSidebarComponent {
  workflowState = inject(WorkflowStateService);
  private workflowService = inject(WorkflowService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private dialogService = inject(DialogService);
  
  // TABS State
  activeTab = signal<'chat' | 'propiedades'>('chat');

  // Chat Form
  promptCtrl = this.fb.control('');
  isGenerating = signal(false);

  // Edit Forms
  editNombreCtrl = this.fb.control('');
  editDeptoCtrl = this.fb.control<string>('null');
  editFormCtrl = this.fb.control<any>({});

  // Global Config form
  globalNombreCtrl = this.fb.control('');
  globalDescCtrl = this.fb.control('');
  globalCategoriaCtrl = this.fb.control('INTERNO');
  globalCostoBaseCtrl = this.fb.control(0);
  globalFormClienteCtrl = this.fb.control<any>({});

  constructor() {
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

  guardarMetadataGlobal() {
    try {
      const parsedForm = this.globalFormClienteCtrl.value || {};
      const n = this.globalNombreCtrl.value || 'Nuevo Trámite';
      const d = this.globalDescCtrl.value || '';
      const c = this.globalCategoriaCtrl.value || 'INTERNO';
      const costo = Number(this.globalCostoBaseCtrl.value) || 0;
      
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
        const isDesc = selected.tipo === 'DECISION';
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


  generarConIA() {
    const prompt = this.promptCtrl.value;
    if (!prompt) return;
    
    this.isGenerating.set(true);

    // Conexión real hacia el backend (ClaudeAiService en Spring Boot)
    this.workflowService.generateWithAi(prompt).subscribe({
      next: (jsonString) => {
        try {
          // Limpieza por si la IA trae markdown a pesar de las instrucciones
          let cleanJson = jsonString.trim();
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
          } else {
            cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
          }

          const parsed = JSON.parse(cleanJson);
          if (parsed && Array.isArray(parsed.pasos)) {
            const deptosReales = this.workflowState.departamentos();
            // Mapeo seguro de nombres devueltos por IA a verdaderos IDs
            parsed.pasos.forEach((p: any) => {
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
          console.error("Error parseando respuesta IA de Spring Boot", e, jsonString);
          this.toast.error("Claude devolvió un formato inválido de JSON. Reintente.");
        }
        this.isGenerating.set(false);
      },
      error: (e) => {
        console.error(e);
        this.isGenerating.set(false);
        this.toast.error("Fallo de comunicación con la API.");
      }
    });
  }
}
