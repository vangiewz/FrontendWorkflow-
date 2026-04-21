import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tramite-form-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass rounded-2xl p-6">
      <!-- Step header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-white">
             {{ step?.nombrePaso }}
             @if (isReadOnly) { <span class="ml-2 text-xs bg-surface-700 text-gray-300 px-2 py-1 rounded">Solo Lectura</span> }
          </h2>
          <p class="text-xs text-gray-400 mt-1">
            {{ step?.tipo === 'DECISION' ? 'Nodo de Decisión' : 'Actividad' }} — 
            {{ departamentoName }}
          </p>
        </div>
        @if (step?.tipo === 'DECISION') {
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><span class="text-amber-400 font-bold">◆</span></div>
        } @else {
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><span class="text-blue-400 font-bold">▶</span></div>
        }
      </div>

      <!-- DECISION node -->
      @if (step?.tipo === 'DECISION') {
         @if (!isReadOnly) {
            @if (canRespond) {
              <div class="space-y-3">
                <p class="text-sm text-gray-300 mb-4">Seleccione la decisión para continuar con el flujo:</p>
                @for (opcion of getDecisionOpciones(step); track opcion) {
                  <button
                    (click)="opcionSeleccionada.emit(opcion)"
                    class="w-full flex items-center justify-between p-4 rounded-xl bg-surface-800 border border-surface-700 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200 group"
                    [disabled]="isSubmitting"
                  >
                    <span class="text-sm font-medium text-gray-200 group-hover:text-white">{{ opcion }}</span>
                    <svg class="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
                  </button>
                }
              </div>
            } @else {
               <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                 <p class="text-sm font-medium text-red-400">Paso asignado a: {{ departamentoName }}</p>
                 <p class="text-xs text-gray-400 mt-1">No tienes permisos para tomar esta decisión.</p>
               </div>
            }
         } @else {
             <div class="p-4 bg-surface-800 border border-surface-700 rounded-xl text-center">
               <p class="text-sm font-medium text-gray-400">Decisión enviada:</p>
               <p class="text-lg font-bold text-violet-400 mt-1">{{ formAnswers['decision'] || 'N/A' }}</p>
             </div>
         }

      <!-- ACTIVITY node -->
      } @else {
         @if (!isReadOnly && !canRespond && !step?.departamentoId) {
             <div class="p-6 text-center bg-violet-500/10 border border-violet-500/20 rounded-xl">
               <p class="text-sm font-medium text-violet-400">Esperando respuesta del Cliente</p>
               <p class="text-xs text-gray-400 mt-2">Este paso requiere intervención del cliente a través de la aplicación móvil.</p>
             </div>
         } @else {
             @if (!isReadOnly && !canRespond) {
                <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center mb-4">
                  <p class="text-sm font-medium text-red-400">Paso asignado a: {{ departamentoName }}</p>
                  <p class="text-xs text-gray-400 mt-1">No posees permisos para interactuar.</p>
                </div>
             }
             
             <!-- Dynamic Form Renderer -->
             <div class="space-y-4" [class.opacity-60]="!canRespond && !isReadOnly">
                @if (formFields.length > 0) {
                   @for (field of formFields; track field.key) {
                      <div>
                        <label class="text-xs block mb-1"
                          [class.text-gray-400]="!field.required"
                          [class.text-gray-300]="field.required">
                          {{ field.label }}
                          @if (field.required && !isReadOnly) { <span class="text-red-400 ml-0.5">*</span> }
                        </label>

                        @if (isReadOnly) {
                           <!-- READ-ONLY display -->
                           <div class="w-full bg-surface-800 border border-surface-700 rounded-lg p-3 text-sm text-gray-300">
                              {{ formattedAnswerValue(field.key, field.type) }}
                           </div>
                        } @else {
                           <!-- EDITABLE inputs — use native (input)/(change) for reliable formData updates -->
                           @if (field.type === 'textarea') {
                             <textarea
                               class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none"
                               [class.border-surface-700]="!field.required || formData[field.key]"
                               [class.border-red-500/40]="field.required && !formData[field.key]"
                               rows="3" [placeholder]="field.label"
                               [disabled]="!canRespond"
                               (input)="formData[field.key] = $any($event.target).value"
                             ></textarea>

                           } @else if (field.type === 'select' && field.options) {
                             <select
                               class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all appearance-none"
                               [class.border-surface-700]="!field.required || formData[field.key]"
                               [class.border-red-500/40]="field.required && !formData[field.key]"
                               [disabled]="!canRespond"
                               (change)="formData[field.key] = $any($event.target).value"
                             >
                               <option value="">— Seleccione —</option>
                               @for (opt of field.options; track opt) { <option [value]="opt">{{ opt }}</option> }
                             </select>

                           } @else if (field.type === 'boolean') {
                             <label class="flex items-center gap-3 p-3 bg-surface-900 border border-surface-700 rounded-lg"
                               [class.cursor-pointer]="canRespond">
                               <input type="checkbox"
                                 class="w-4 h-4 rounded border-surface-600 text-purple-500 focus:ring-purple-500 bg-surface-700"
                                 [disabled]="!canRespond"
                                 (change)="formData[field.key] = $any($event.target).checked">
                               <span class="text-sm text-gray-300">{{ field.label }}</span>
                             </label>

                           } @else {
                             <!-- text / number / date / datetime-local -->
                             <input
                               [type]="field.type || 'text'"
                               class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                               [class.border-surface-700]="!field.required || formData[field.key]"
                               [class.border-red-500/40]="field.required && !formData[field.key]"
                               [placeholder]="field.label + (field.required ? ' (obligatorio)' : '')"
                               [disabled]="!canRespond"
                               (input)="formData[field.key] = $any($event.target).value"
                               (change)="formData[field.key] = $any($event.target).value"
                             >
                           }
                        }
                      </div>
                   }
                } @else {
                   <div class="p-4 bg-surface-800 rounded-xl text-center">
                     <p class="text-xs text-gray-400">Este paso no tiene formulario. Presiona completar para avanzar.</p>
                   </div>
                }

                <!-- Actions: only shown for active editable step -->
                @if (!isReadOnly && canRespond) {
                   @if (!isFormValid()) {
                     <p class="text-[11px] text-red-400/70 mt-2">* Complete todos los campos obligatorios</p>
                   }
                   <!-- native button with hard guard to prevent bypass -->
                   <button
                     class="w-full mt-4 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200"
                     [class.bg-purple-600]="isFormValid() && !isSubmitting"
                     [class.hover:bg-purple-500]="isFormValid() && !isSubmitting"
                     [class.text-white]="isFormValid() && !isSubmitting"
                     [class.bg-surface-700]="!isFormValid() || isSubmitting"
                     [class.text-gray-500]="!isFormValid() || isSubmitting"
                     [class.cursor-not-allowed]="!isFormValid() || isSubmitting"
                     (click)="submitForm()"
                   >
                     {{ isSubmitting ? 'Procesando...' : 'Completar Paso' }}
                   </button>
                }
             </div>
         }
      }
    </div>
  `
})
export class TramiteFormViewerComponent implements OnChanges {
  @Input() step: any = null;
  @Input() departamentoName = '';
  @Input() isReadOnly = false;
  @Input() canRespond = false;
  @Input() formAnswers: Record<string, any> = {};
  @Input() isSubmitting = false;

  @Output() opcionSeleccionada = new EventEmitter<string>();
  @Output() formularioEnviado = new EventEmitter<Record<string, any>>();

  formData: Record<string, any> = {};
  formFields: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    // Only reset when the STEP itself changes, not on every parent re-render
    if (changes['step']) {
      this.formData = {};
      this.formFields = this.step?.formularioJson
        ? this.buildFormFields(this.step.formularioJson)
        : [];
    }
    // Populate with saved answers when switching to read-only mode
    if (changes['isReadOnly'] && this.isReadOnly && this.formAnswers) {
      this.formData = { ...this.formAnswers };
    }
    if (changes['formAnswers'] && this.isReadOnly) {
      this.formData = { ...this.formAnswers };
    }
  }

  /** Guard: only emit if all required fields are truly filled */
  submitForm() {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.formularioEnviado.emit({ ...this.formData });
  }

  getDecisionOpciones(paso: any): string[] {
    return paso?.siguientes ? Object.keys(paso.siguientes) : [];
  }

  hasFormProperties(schema: any): boolean {
    return schema && schema['properties'] && Object.keys(schema['properties']).length > 0;
  }

  formattedAnswerValue(key: string, type: string): string {
    const val = this.formData[key];
    if (val === undefined || val === null || val === '') return 'N/A';
    if (type === 'boolean') return val ? 'Sí' : 'No';
    return val.toString();
  }

  buildFormFields(schema: Record<string, any>): any[] {
    if (!schema || !schema['properties']) return [];
    const props = schema['properties'] as Record<string, any>;
    const requiredFields: string[] = schema['required'] || [];
    return Object.entries(props).map(([key, val]) => {
      let type = 'text';
      if (val?.type === 'boolean') {
        type = 'boolean';
      } else if (val?.type === 'integer' || val?.type === 'number') {
        type = 'number';
      } else if (val?.type === 'string') {
        if (val?.enum) type = 'select';
        else if (val?.format === 'date') type = 'date';
        else if (val?.format === 'date-time') type = 'datetime-local';
        else if (val?.format === 'textarea') type = 'textarea';
        else type = 'text';
      }
      return {
        key,
        label: val?.title || val?.description || key,
        type,
        required: requiredFields.includes(key),
        options: val?.enum
      };
    });
  }

  isFormValid(): boolean {
    const schema = this.step?.formularioJson;
    if (!schema || !schema['required']) return true;
    const requiredFields: string[] = schema['required'];
    return requiredFields.every(key => {
      const val = this.formData[key];
      return val !== undefined && val !== null && val !== '';
    });
  }
}
