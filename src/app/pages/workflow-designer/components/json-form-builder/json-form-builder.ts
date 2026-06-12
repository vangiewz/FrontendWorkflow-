import { Component, ChangeDetectionStrategy, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Using ngModel for simple databinding here
import { WorkflowStateService } from '../../services/workflow-state.service';
import { DragDropFormBuilderComponent } from '../drag-drop-form-builder/drag-drop-form-builder';

export interface GridColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
}

export interface PermissionSetting {
  role: string;
  permission: 'LECTURA' | 'EDICION' | 'AMBOS';
}

export interface FormFieldItem {
  key: string;
  type: string; // string, number, boolean, date, datetime, file, grid, ARCHIVO_ESTATICO, DOCUMENTO_COLABORATIVO, select
  description: string;
  isRequired: boolean;
  gridColumns?: GridColumn[];
  formatosPermitidos?: string[];
  tamanoMaximoMB?: number;
  permisosPorDefecto?: PermissionSetting[];
  opciones?: string[];
}

@Component({
  selector: 'app-json-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropFormBuilderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      
      <button class="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 mb-2" (click)="showVisualBuilder.set(true)">
        <span class="text-base">✨</span> Abrir Constructor Visual (Drag & Drop)
      </button>

      @if (showVisualBuilder()) {
        <app-drag-drop-form-builder 
          [initialFields]="fields()" 
          (saveFields)="onVisualBuilderSave($event)" 
          (closeModal)="showVisualBuilder.set(false)">
        </app-drag-drop-form-builder>
      }

      @if (fields().length === 0) {
        <div class="text-center p-4 border border-dashed border-surface-700 rounded-lg text-gray-500 text-xs">
          No hay campos definidos.
        </div>
      }

      @for (field of fields(); track $index; let fieldIndex = $index) {
        <div class="flex flex-col gap-2 p-3 bg-surface-900 border border-surface-700 rounded-lg group transition-all hover:border-emerald-500/30">
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-gray-400">Campo #{{ fieldIndex + 1 }}</span>
            <button class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300" (click)="removeField(fieldIndex)" title="Eliminar campo">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
               <label class="text-[10px] text-gray-500 uppercase tracking-wide">Clave Interna (ID)</label>
               <input type="text" [ngModel]="field.key" (ngModelChange)="updateField(fieldIndex, {key: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-600" placeholder="Ej. nombre_completo">
            </div>
            <div>
               <label class="text-[10px] text-gray-500 uppercase tracking-wide">Tipo de Dato</label>
                 <select [ngModel]="field.type" (ngModelChange)="updateField(fieldIndex, {type: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none appearance-none">
                 <option value="string">Texto</option>
                 <option value="number">Número</option>
                 <option value="boolean">Verdadero / Falso (Checkbox)</option>
                 <option value="date">Fecha</option>
                 <option value="datetime">Fecha y Hora</option>
                 <option value="select">Selector / Desplegable</option>
                 <option value="grid">Grid (Tabla Dinámica)</option>
                 <option value="ARCHIVO_ESTATICO">Archivo Estático</option>
                 <option value="DOCUMENTO_COLABORATIVO">Documento Colaborativo</option>
               </select>
            </div>
          </div>
          
          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-wide">Etiqueta o Descripción (Visible para usuario)</label>
            <input type="text" [ngModel]="field.description" (ngModelChange)="updateField(fieldIndex, {description: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-600" placeholder="Ej. Escriba su nombre completo">
          </div>

          <div class="flex items-center gap-2 mt-1">
             <input type="checkbox" [ngModel]="field.isRequired" (ngModelChange)="updateField(fieldIndex, {isRequired: $event})" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
             <label class="text-xs text-gray-400 cursor-pointer" (click)="updateField(fieldIndex, {isRequired: !field.isRequired})">Establecer como obligatorio</label>
          </div>

          @if (field.type === 'select') {
            <div class="mt-2.5 p-3 bg-surface-950/60 border border-surface-800 rounded-lg space-y-2">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Opciones del Selector</span>
              
              @for (opt of field.opciones || []; track $index; let optIdx = $index) {
                <div class="flex gap-2 items-center bg-surface-900 p-2 rounded border border-surface-800/80">
                  <div class="flex-1 min-w-0">
                    <input type="text" [ngModel]="opt" (ngModelChange)="updateOption(fieldIndex, optIdx, $event)"
                           class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Nombre de la opción">
                  </div>
                  <button class="text-red-400 hover:text-red-300 p-1 shrink-0" (click)="removeOption(fieldIndex, optIdx)" title="Eliminar opción">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              }
              
              <button class="py-1.5 px-3 border border-dashed border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 rounded text-[10px] font-semibold transition-all uppercase flex items-center justify-center gap-1.5 w-full mt-2"
                      (click)="addOption(fieldIndex)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Añadir Opción
              </button>
            </div>
          }

          @if (field.type === 'grid') {
            <div class="mt-2.5 p-3 bg-surface-950/60 border border-surface-800 rounded-lg space-y-2">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Columnas de la Grid</span>
              
              @for (col of field.gridColumns || []; track col.key || $index; let colIndex = $index) {
                <div class="flex gap-2 items-center bg-surface-900 p-2 rounded border border-surface-800/80">
                  <div class="flex-1 min-w-0">
                    <label class="text-[9px] text-gray-500 uppercase">Clave</label>
                    <input type="text" [ngModel]="col.key" (ngModelChange)="updateGridColumn(fieldIndex, colIndex, {key: $event})"
                           class="w-full bg-surface-800 border border-surface-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Id columna">
                  </div>
                  <div class="flex-1 min-w-0">
                    <label class="text-[9px] text-gray-500 uppercase">Etiqueta</label>
                    <input type="text" [ngModel]="col.label" (ngModelChange)="updateGridColumn(fieldIndex, colIndex, {label: $event})"
                           class="w-full bg-surface-800 border border-surface-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Nombre visible">
                  </div>
                  <div class="w-24 shrink-0">
                    <label class="text-[9px] text-gray-500 uppercase">Tipo</label>
                    <select [ngModel]="col.type" (ngModelChange)="updateGridColumn(fieldIndex, colIndex, {type: $event})"
                            class="w-full bg-surface-800 border border-surface-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                      <option value="string">Texto</option>
                      <option value="number">Número</option>
                      <option value="boolean">Si / No</option>
                    </select>
                  </div>
                  <button class="text-red-400 hover:text-red-300 p-1 mt-3 shrink-0" (click)="removeGridColumn(fieldIndex, colIndex)" title="Eliminar columna">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              }
              
              <button class="py-1.5 px-3 border border-dashed border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 rounded text-[10px] font-semibold transition-all uppercase flex items-center justify-center gap-1.5"
                      (click)="addGridColumn(fieldIndex)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Añadir Columna
              </button>
            </div>
          }

          @if (field.type === 'ARCHIVO_ESTATICO') {
            <div class="mt-2.5 p-3 bg-surface-950/60 border border-surface-800 rounded-lg space-y-2">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Configuración de Archivo Estático</span>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Formatos Permitidos</label>
                  <div class="flex flex-col gap-1.5 bg-surface-900 p-2 rounded border border-surface-800/80">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [checked]="field.formatosPermitidos?.includes('.pdf')" (change)="toggleFormato(fieldIndex, '.pdf')" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
                      <span class="text-[11px] text-gray-300">PDF (.pdf)</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [checked]="field.formatosPermitidos?.includes('.jpg')" (change)="toggleFormato(fieldIndex, '.jpg')" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
                      <span class="text-[11px] text-gray-300">Imagen JPG (.jpg)</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [checked]="field.formatosPermitidos?.includes('.png')" (change)="toggleFormato(fieldIndex, '.png')" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
                      <span class="text-[11px] text-gray-300">Imagen PNG (.png)</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [checked]="field.formatosPermitidos?.includes('.docx')" (change)="toggleFormato(fieldIndex, '.docx')" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
                      <span class="text-[11px] text-gray-300">Word (.docx)</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [checked]="field.formatosPermitidos?.includes('.xlsx')" (change)="toggleFormato(fieldIndex, '.xlsx')" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
                      <span class="text-[11px] text-gray-300">Excel (.xlsx)</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [checked]="field.formatosPermitidos?.includes('.pptx')" (change)="toggleFormato(fieldIndex, '.pptx')" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
                      <span class="text-[11px] text-gray-300">PowerPoint (.pptx)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label class="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Tamaño Máximo (MB)</label>
                  <input type="number" [ngModel]="field.tamanoMaximoMB" (ngModelChange)="updateField(fieldIndex, {tamanoMaximoMB: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-600" placeholder="Ej. 5">
                </div>
              </div>
            </div>
          }

          @if (field.type === 'ARCHIVO_ESTATICO' || field.type === 'DOCUMENTO_COLABORATIVO') {
            <div class="mt-2.5 p-3 bg-surface-950/60 border border-surface-800 rounded-lg space-y-2">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Configuración de Permisos y Roles</span>
              
              @for (perm of field.permisosPorDefecto || []; track $index; let permIndex = $index) {
                <div class="flex gap-2 items-center bg-surface-900 p-2 rounded border border-surface-800/80">
                  <div class="flex-1 min-w-0">
                    <label class="text-[9px] text-gray-500 uppercase">Rol/Departamento</label>
                    <select [ngModel]="perm.role" (ngModelChange)="updatePermission(fieldIndex, permIndex, {role: $event})"
                            class="w-full bg-surface-800 border border-surface-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                      <option value="">Seleccione un rol...</option>
                      @if (field.type !== 'DOCUMENTO_COLABORATIVO') {
                        <option value="CLIENTE">CLIENTE (Solicitante)</option>
                      }
                      @for (depto of departamentos(); track depto.id) {
                        <option [value]="depto.id">{{ depto.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="w-32 shrink-0">
                    <label class="text-[9px] text-gray-500 uppercase">Nivel de Acceso</label>
                    <select [ngModel]="perm.permission" (ngModelChange)="updatePermission(fieldIndex, permIndex, {permission: $event})"
                            class="w-full bg-surface-800 border border-surface-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                      <option value="LECTURA">LECTURA</option>
                      <option value="EDICION">EDICIÓN</option>
                      <option value="AMBOS">AMBOS</option>
                    </select>
                  </div>
                  <button class="text-red-400 hover:text-red-300 p-1 mt-3 shrink-0" (click)="removePermission(fieldIndex, permIndex)" title="Eliminar permiso">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              }
              
              <button class="py-1.5 px-3 border border-dashed border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 rounded text-[10px] font-semibold transition-all uppercase flex items-center justify-center gap-1.5"
                      (click)="addPermission(fieldIndex)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Añadir Rol
              </button>
              @if (field.type === 'DOCUMENTO_COLABORATIVO') {
                <div class="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded flex items-start gap-2">
                  <svg class="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <p class="text-[10px] text-amber-500/90 leading-tight">Los documentos colaborativos son de uso interno exclusivo. El rol CLIENTE no puede participar en ellos.</p>
                </div>
              }
            </div>
          }

          @if (field.type === 'DOCUMENTO_COLABORATIVO') {
            <div class="mt-2.5 p-3 bg-surface-950/60 border border-surface-800 rounded-lg space-y-2">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Formato del Documento</span>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" [ngModel]="field.formatosPermitidos?.[0]" (ngModelChange)="updateField(fieldIndex, {formatosPermitidos: [$event]})" value="WORD" class="text-emerald-500 focus:ring-emerald-500 bg-surface-800 border-surface-600">
                  <span class="text-xs text-gray-300">Microsoft Word (.docx)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" [ngModel]="field.formatosPermitidos?.[0]" (ngModelChange)="updateField(fieldIndex, {formatosPermitidos: [$event]})" value="EXCEL" class="text-emerald-500 focus:ring-emerald-500 bg-surface-800 border-surface-600">
                  <span class="text-xs text-gray-300">Microsoft Excel (.xlsx)</span>
                </label>
              </div>
            </div>
          }
        </div>
      }

      <button class="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/60 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase flex items-center justify-center gap-2" (click)="addField()">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Añadir Campo
      </button>
    </div>
  `
})
export class JsonFormBuilderComponent {
  schema = input<any>({});
  schemaChange = output<any>();

  fields = signal<FormFieldItem[]>([]);
  showVisualBuilder = signal(false);
  isInternalChange = false;
  private lastSerializedSchema = '';

  private readonly workflowState = inject(WorkflowStateService);
  readonly departamentos = this.workflowState.departamentos;

  constructor() {
    effect(() => {
      const currentSchema = this.schema();
      const serialized = JSON.stringify(currentSchema || {});
      if (serialized !== this.lastSerializedSchema) {
         this.lastSerializedSchema = serialized;
         this.parseSchema(currentSchema);
      }
    });
  }

  parseSchema(s: any) {
     if (!s || !s.properties) {
        this.fields.set([]);
        return;
     }
     
     const props = s.properties || {};
     const req = s.required || [];
     
     const parsedFields = Object.keys(props).map(k => {
        // Detectar campos de fecha por format
        let fieldType = props[k]?.type || 'string';
        if (fieldType === 'string' && props[k]?.format === 'date') fieldType = 'date';
        if (fieldType === 'string' && props[k]?.format === 'date-time') fieldType = 'datetime';
        if (fieldType === 'string' && props[k]?.enum) fieldType = 'select';
        
        let gridCols: GridColumn[] = [];
        if (fieldType === 'array' || fieldType === 'grid') {
          fieldType = 'grid';
          const items = props[k]?.items || {};
          const itemProps = items.properties || {};
          gridCols = Object.keys(itemProps).map(colKey => {
            const colVal = itemProps[colKey];
            let colType = colVal.type || 'string';
            if (colType === 'integer' || colType === 'number') colType = 'number';
            return {
              key: colKey,
              label: colVal.title || colVal.description || colKey,
              type: colType as 'string' | 'number' | 'boolean'
            };
          });
        }

        let permisosList: PermissionSetting[] | undefined = undefined;
        if (fieldType === 'ARCHIVO_ESTATICO' || fieldType === 'DOCUMENTO_COLABORATIVO') {
           const pMap = props[k]?.permisosPorDefecto || {};
           permisosList = Object.keys(pMap).map(role => ({
             role: role,
             permission: pMap[role] as any
           }));
        }

        return {
           key: k,
           type: fieldType,
           description: props[k]?.description || '',
           isRequired: req.includes(k),
           gridColumns: gridCols.length > 0 ? gridCols : undefined,
           permisosPorDefecto: permisosList && permisosList.length > 0 ? permisosList : undefined,
           formatosPermitidos: props[k]?.formatosPermitidos || undefined,
           tamanoMaximoMB: props[k]?.tamanoMaximoMB || undefined,
           opciones: props[k]?.enum || undefined
        };
     });
     
     this.fields.set(parsedFields);
  }

  addField() {
    this.fields.update(f => [...f, {
       key: `campo${f.length + 1}`,
       type: 'string',
       description: '',
       isRequired: false
    }]);
    this.emitChanges();
  }

  updateField(index: number, changes: Partial<FormFieldItem>) {
    this.fields.update(fields => {
      const newFields = [...fields];
      let field = { ...newFields[index], ...changes };
      if (field.type === 'grid' && (!field.gridColumns || field.gridColumns.length === 0)) {
         field.gridColumns = [
           { key: 'columna1', label: 'Columna 1', type: 'string' }
         ];
      }
      if (field.type === 'select' && (!field.opciones || field.opciones.length === 0)) {
         field.opciones = ['Opción 1', 'Opción 2'];
      }
      if (field.type === 'ARCHIVO_ESTATICO' && (!field.permisosPorDefecto || field.permisosPorDefecto.length === 0)) {
         field.permisosPorDefecto = [
           { role: 'CLIENTE', permission: 'LECTURA' }
         ];
      }
      if (field.type === 'DOCUMENTO_COLABORATIVO') {
         if (!field.permisosPorDefecto || field.permisosPorDefecto.length === 0) {
            field.permisosPorDefecto = [];
         } else {
            // Eliminar permisos de CLIENTE si se cambia a DOCUMENTO_COLABORATIVO
            field.permisosPorDefecto = field.permisosPorDefecto.filter(p => p.role !== 'CLIENTE');
         }
         
         if (!field.formatosPermitidos || field.formatosPermitidos.length === 0) {
            field.formatosPermitidos = ['WORD'];
         }
      }
      newFields[index] = field;
      return newFields;
    });
    this.emitChanges();
  }

  removeField(index: number) {
    this.fields.update(f => f.filter((_, i) => i !== index));
    this.emitChanges();
  }

  updateGridColumn(fieldIndex: number, colIndex: number, changes: Partial<GridColumn>) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const cols = [...(field.gridColumns || [])];
      cols[colIndex] = { ...cols[colIndex], ...changes } as GridColumn;
      field.gridColumns = cols;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  addGridColumn(fieldIndex: number) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const cols = [...(field.gridColumns || [])];
      cols.push({
        key: `columna${cols.length + 1}`,
        label: `Columna ${cols.length + 1}`,
        type: 'string'
      });
      field.gridColumns = cols;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  removeGridColumn(fieldIndex: number, colIndex: number) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const cols = (field.gridColumns || []).filter((_, i) => i !== colIndex);
      field.gridColumns = cols;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  updatePermission(fieldIndex: number, permIndex: number, changes: Partial<PermissionSetting>) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const perms = [...(field.permisosPorDefecto || [])];
      perms[permIndex] = { ...perms[permIndex], ...changes } as PermissionSetting;
      field.permisosPorDefecto = perms;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  addPermission(fieldIndex: number) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const perms = [...(field.permisosPorDefecto || [])];
      perms.push({ role: '', permission: 'LECTURA' });
      field.permisosPorDefecto = perms;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  removePermission(fieldIndex: number, permIndex: number) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const perms = (field.permisosPorDefecto || []).filter((_, i) => i !== permIndex);
      field.permisosPorDefecto = perms;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  toggleFormato(fieldIndex: number, ext: string) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const current = field.formatosPermitidos || [];
      if (current.includes(ext)) {
        field.formatosPermitidos = current.filter(e => e !== ext);
      } else {
        field.formatosPermitidos = [...current, ext];
      }
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  updateOption(fieldIndex: number, optIdx: number, value: string) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const opts = [...(field.opciones || [])];
      opts[optIdx] = value;
      field.opciones = opts;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  addOption(fieldIndex: number) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const opts = [...(field.opciones || [])];
      opts.push(`Opción ${opts.length + 1}`);
      field.opciones = opts;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  removeOption(fieldIndex: number, optIdx: number) {
    this.fields.update(fields => {
      const newFields = [...fields];
      const field = { ...newFields[fieldIndex] };
      const opts = (field.opciones || []).filter((_, i) => i !== optIdx);
      // Ensure at least one option remains, or empty array if they really want
      field.opciones = opts;
      newFields[fieldIndex] = field;
      return newFields;
    });
    this.emitChanges();
  }

  emitChanges() {
    this.isInternalChange = true;
    const f = this.fields();
    
    const properties: any = {};
    const required: string[] = [];
    
    f.forEach(item => {
        const safeKey = item.key.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'campo';
        const prop: any = {
           description: item.description
        };
        // Mapear tipos visuales a JSON Schema
        if (item.type === 'date') {
          prop.type = 'string';
          prop.format = 'date';
        } else if (item.type === 'datetime') {
          prop.type = 'string';
          prop.format = 'date-time';
        } else if (item.type === 'grid') {
          prop.type = 'array';
          const colProperties: any = {};
          const cols = item.gridColumns || [];
          cols.forEach(col => {
            const safeColKey = col.key.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'columna';
            colProperties[safeColKey] = {
              type: col.type === 'number' ? 'number' : col.type,
              title: col.label || safeColKey
            };
          });
            prop.items = {
              type: 'object',
              properties: colProperties
            };
          } else if (item.type === 'select') {
            prop.type = 'string';
            prop.enum = item.opciones && item.opciones.length > 0 ? item.opciones : ['Opción 1'];
          } else if (item.type === 'ARCHIVO_ESTATICO' || item.type === 'DOCUMENTO_COLABORATIVO') {
            prop.type = item.type;
          const mapPermisos: any = {};
          (item.permisosPorDefecto || []).forEach(p => {
             if (p.role) {
                mapPermisos[p.role] = p.permission;
             }
          });
          prop.permisosPorDefecto = mapPermisos;
          
          if ((item.type === 'DOCUMENTO_COLABORATIVO' || item.type === 'ARCHIVO_ESTATICO') && item.formatosPermitidos) {
             prop.formatosPermitidos = item.formatosPermitidos;
          }
          if (item.type === 'ARCHIVO_ESTATICO' && item.tamanoMaximoMB) {
             prop.tamanoMaximoMB = item.tamanoMaximoMB;
          }
        } else {
          prop.type = item.type;
        }
        properties[safeKey] = prop;
        if (item.isRequired) {
           required.push(safeKey);
        }
    });

    const newSchema = {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined
    };
    
    // Si no quedan propiedades, por simplicidad enviamos objeto base vacío
    if (Object.keys(properties).length === 0) {
      const emptySchema = {};
      this.lastSerializedSchema = JSON.stringify(emptySchema);
      this.schemaChange.emit(emptySchema);
      return;
    }

    this.lastSerializedSchema = JSON.stringify(newSchema);
    this.schemaChange.emit(newSchema);
  }

  onVisualBuilderSave(newFields: FormFieldItem[]) {
    this.fields.set(newFields);
    this.emitChanges();
    this.showVisualBuilder.set(false);
  }
}
