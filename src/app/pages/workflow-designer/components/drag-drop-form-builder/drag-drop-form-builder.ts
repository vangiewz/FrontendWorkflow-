import { Component, ChangeDetectionStrategy, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, copyArrayItem } from '@angular/cdk/drag-drop';
import { FormFieldItem, GridColumn, PermissionSetting } from '../json-form-builder/json-form-builder';
import { WorkflowStateService } from '../../services/workflow-state.service';

interface PaletteItem {
  type: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-drag-drop-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[100] flex flex-col bg-surface-950 font-sans" (click)="clearSelection()">
      <!-- Header -->
      <header class="h-14 bg-surface-900 border-b border-surface-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          </div>
          <h2 class="text-sm font-semibold text-white tracking-wide">Constructor Visual de Formularios</h2>
        </div>
        <div class="flex items-center gap-3">
          <button class="px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors" (click)="closeModal.emit()">
            Cancelar
          </button>
          <button class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-2" (click)="save()">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Guardar Formulario
          </button>
        </div>
      </header>

      <!-- 3 Columns Layout -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Left: Palette -->
        <div class="w-64 bg-surface-900 border-r border-surface-800 flex flex-col shrink-0">
          <div class="p-4 border-b border-surface-800">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Herramientas</h3>
            <p class="text-[10px] text-gray-500 mt-1">Arrastra los campos al lienzo</p>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div 
              cdkDropList 
              [cdkDropListData]="paletteItems"
              cdkDropListConnectedTo="canvasList"
              [cdkDropListSortingDisabled]="true"
              class="flex flex-col gap-2"
            >
              @for (item of paletteItems; track item.type) {
                <div cdkDrag [cdkDragData]="item" class="bg-surface-800 border border-surface-700 p-3 rounded-lg text-xs text-gray-300 cursor-grab hover:border-emerald-500/50 hover:bg-surface-800/80 transition-colors flex items-center gap-3 group">
                  <span class="text-xl group-hover:scale-110 transition-transform" [innerHTML]="item.icon"></span>
                  <span class="font-medium">{{ item.label }}</span>
                  
                  <!-- Drag Preview -->
                  <div *cdkDragPreview class="bg-surface-800 border-2 border-emerald-500 p-3 rounded-lg text-xs text-white shadow-xl shadow-black flex items-center gap-3 w-64 opacity-90">
                    <span class="text-xl" [innerHTML]="item.icon"></span>
                    <span class="font-medium">{{ item.label }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Center: Canvas -->
        <div class="flex-1 bg-surface-950 overflow-y-auto p-8 relative flex justify-center" (click)="$event.stopPropagation(); clearSelection()">
          <div class="w-full max-w-2xl">
            <div class="mb-6">
              <h3 class="text-lg font-medium text-white">Diseño del Formulario</h3>
              <p class="text-xs text-gray-400 mt-1">Arrastra los elementos desde la izquierda y suéltalos aquí. Selecciona un campo para configurarlo a la derecha.</p>
            </div>
            
            <div 
              id="canvasList"
              cdkDropList 
              [cdkDropListData]="fields()"
              (cdkDropListDropped)="drop($event)"
              class="min-h-[400px] bg-surface-900/50 border-2 border-dashed rounded-xl p-4 transition-colors relative"
              [class.border-surface-700]="fields().length > 0"
              [class.border-emerald-500/30]="fields().length === 0"
            >
              @if (fields().length === 0) {
                <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
                  <svg class="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  <p class="text-sm">Suelta un campo aquí</p>
                </div>
              }

              @for (field of fields(); track field.key; let idx = $index) {
                <div cdkDrag class="relative mb-3 group/item">
                  <div 
                    class="bg-surface-800 border rounded-lg p-4 cursor-pointer transition-all hover:border-emerald-500/50"
                    [class.border-emerald-500]="selectedIndex() === idx"
                    [class.border-surface-700]="selectedIndex() !== idx"
                    [class.ring-1]="selectedIndex() === idx"
                    [class.ring-emerald-500]="selectedIndex() === idx"
                    (click)="$event.stopPropagation(); selectField(idx)"
                  >
                    <!-- Drag Handle -->
                    <div cdkDragHandle class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-8 bg-surface-700 rounded flex items-center justify-center cursor-grab opacity-0 group-hover/item:opacity-100 transition-opacity z-10 hover:bg-emerald-600 text-white border border-surface-600 shadow-md">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>
                    </div>

                    <!-- Delete button -->
                    <button class="absolute -right-2 -top-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10" (click)="$event.stopPropagation(); removeField(idx)">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>

                    <!-- Field Preview -->
                    <div class="flex items-start gap-4 pointer-events-none">
                      <div class="w-10 h-10 rounded-lg bg-surface-900 border border-surface-700 flex items-center justify-center shrink-0 text-gray-400">
                        <span class="text-xl" [innerHTML]="getIconForType(field.type)"></span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-medium text-white truncate">{{ field.description || 'Sin Etiqueta' }}</span>
                          @if (field.isRequired) {
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">*</span>
                          }
                        </div>
                        <p class="text-xs text-gray-500 font-mono">{{ field.key }} <span class="text-gray-600 ml-1">({{ field.type }})</span></p>
                        
                        <!-- Visual hint based on type -->
                        <div class="mt-3">
                          @if (field.type === 'string') {
                            <div class="w-full h-8 border border-surface-700 rounded bg-surface-900/50"></div>
                          } @else if (field.type === 'number') {
                            <div class="w-32 h-8 border border-surface-700 rounded bg-surface-900/50 text-right pr-2 text-gray-600 flex items-center justify-end font-mono">0.00</div>
                          } @else if (field.type === 'boolean') {
                            <div class="w-5 h-5 border border-surface-700 rounded bg-surface-900/50"></div>
                          } @else if (field.type === 'date' || field.type === 'datetime') {
                            <div class="w-48 h-8 border border-surface-700 rounded bg-surface-900/50 flex items-center px-2 text-gray-600"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                          } @else if (field.type === 'grid') {
                            <div class="w-full border border-surface-700 rounded bg-surface-900/50 overflow-hidden">
                              <div class="h-6 border-b border-surface-700 bg-surface-800 flex items-center px-2 gap-2">
                                @for (col of field.gridColumns; track col.key) {
                                  <div class="h-2 bg-surface-600 rounded flex-1"></div>
                                }
                              </div>
                              <div class="h-6"></div>
                            </div>
                          } @else if (field.type === 'ARCHIVO_ESTATICO' || field.type === 'DOCUMENTO_COLABORATIVO') {
                            <div class="w-full h-12 border-2 border-dashed border-surface-700 rounded flex flex-col items-center justify-center gap-1 text-gray-600">
                              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div *cdkDragPreview class="bg-surface-800 border-2 border-emerald-500 rounded-lg p-4 opacity-90 shadow-xl shadow-black w-96 flex items-center gap-4">
                     <span class="text-2xl text-gray-400" [innerHTML]="getIconForType(field.type)"></span>
                     <span class="text-sm font-medium text-white">{{ field.description || 'Sin Etiqueta' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Properties -->
        <div class="w-80 bg-surface-900 border-l border-surface-800 flex flex-col shrink-0" (click)="$event.stopPropagation()">
          <div class="p-4 border-b border-surface-800">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Propiedades</h3>
          </div>
          <div class="flex-1 overflow-y-auto p-5">
            @if (selectedIndex() !== null && fields()[selectedIndex()!]; as selectedField) {
              
              <!-- Basic Properties -->
              <div class="space-y-4">
                <div>
                  <label class="text-[10px] text-emerald-400 font-bold uppercase tracking-wide block mb-1">Tipo de Componente</label>
                  <div class="bg-surface-800 px-3 py-1.5 rounded border border-surface-700 text-xs text-gray-300 flex items-center gap-2">
                    <span [innerHTML]="getIconForType(selectedField.type)"></span>
                    {{ getLabelForType(selectedField.type) }}
                  </div>
                </div>

                <div>
                  <label class="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Clave (ID Interno)</label>
                  <input type="text" [ngModel]="selectedField.key" (ngModelChange)="updateSelectedField({key: $event})" class="w-full bg-surface-800 border border-surface-700 rounded-md p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" placeholder="ej_campo_1">
                </div>

                <div>
                  <label class="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Etiqueta Visible</label>
                  <input type="text" [ngModel]="selectedField.description" (ngModelChange)="updateSelectedField({description: $event})" class="w-full bg-surface-800 border border-surface-700 rounded-md p-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors" placeholder="Ej. Ingrese valor">
                </div>

                <label class="flex items-center gap-3 cursor-pointer p-3 bg-surface-800 border border-surface-700 rounded-md hover:border-surface-600 transition-colors mt-2">
                  <input type="checkbox" [ngModel]="selectedField.isRequired" (ngModelChange)="updateSelectedField({isRequired: $event})" class="w-4 h-4 rounded border-surface-600 text-emerald-500 bg-surface-900 focus:ring-emerald-500 cursor-pointer">
                  <span class="text-xs font-medium text-gray-300">Campo Obligatorio</span>
                </label>
              </div>

              <!-- Advanced Properties for GRID -->
              @if (selectedField.type === 'grid') {
                <div class="mt-6 pt-4 border-t border-surface-800 space-y-3">
                  <h4 class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Columnas de la Tabla</h4>
                  
                  @for (col of selectedField.gridColumns || []; track col.key; let cIdx = $index) {
                    <div class="bg-surface-800 p-3 rounded-md border border-surface-700 relative group/col">
                      <button class="absolute -right-1 -top-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover/col:opacity-100 transition-opacity" (click)="removeGridColumn(cIdx)">
                        <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <div class="space-y-2">
                        <input type="text" [ngModel]="col.label" (ngModelChange)="updateGridColumn(cIdx, {label: $event})" class="w-full bg-surface-900 border border-surface-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="Título columna">
                        <div class="flex gap-2">
                           <input type="text" [ngModel]="col.key" (ngModelChange)="updateGridColumn(cIdx, {key: $event})" class="w-1/2 bg-surface-900 border border-surface-700 rounded p-1.5 text-[10px] text-gray-400 focus:outline-none" placeholder="Clave">
                           <select [ngModel]="col.type" (ngModelChange)="updateGridColumn(cIdx, {type: $event})" class="w-1/2 bg-surface-900 border border-surface-700 rounded p-1.5 text-[10px] text-gray-300 focus:outline-none">
                             <option value="string">Texto</option>
                             <option value="number">Número</option>
                             <option value="boolean">Si/No</option>
                           </select>
                        </div>
                      </div>
                    </div>
                  }
                  
                  <button class="w-full py-2 border border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-md text-[10px] font-bold uppercase transition-colors" (click)="addGridColumn()">
                    + Añadir Columna
                  </button>
                </div>
              }

              <!-- Advanced Properties for FILES -->
              @if (selectedField.type === 'ARCHIVO_ESTATICO' || selectedField.type === 'DOCUMENTO_COLABORATIVO') {
                <div class="mt-6 pt-4 border-t border-surface-800 space-y-4">
                  <h4 class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Configuración de Archivo</h4>

                  @if (selectedField.type === 'ARCHIVO_ESTATICO') {
                    <div>
                      <label class="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Tamaño Máximo (MB)</label>
                      <input type="number" [ngModel]="selectedField.tamanoMaximoMB" (ngModelChange)="updateSelectedField({tamanoMaximoMB: $event})" class="w-full bg-surface-800 border border-surface-700 rounded-md p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    </div>
                    <div>
                      <label class="text-[10px] text-gray-400 uppercase tracking-wide block mb-2">Formatos Permitidos</label>
                      <div class="flex flex-wrap gap-2">
                        @for (ext of ['.pdf', '.jpg', '.png', '.docx', '.xlsx']; track ext) {
                          <label class="flex items-center gap-1.5 bg-surface-800 px-2 py-1 rounded border border-surface-700 cursor-pointer hover:bg-surface-700 transition-colors">
                            <input type="checkbox" [checked]="selectedField.formatosPermitidos?.includes(ext)" (change)="toggleFileFormat(ext)" class="w-3 h-3 text-emerald-500 bg-surface-900 border-surface-600 rounded">
                            <span class="text-[10px] text-gray-300">{{ ext }}</span>
                          </label>
                        }
                      </div>
                    </div>
                  } @else {
                     <div>
                      <label class="text-[10px] text-gray-400 uppercase tracking-wide block mb-2">Formato del Documento</label>
                      <select [ngModel]="selectedField.formatosPermitidos?.[0]" (ngModelChange)="updateSelectedField({formatosPermitidos: [$event]})" class="w-full bg-surface-800 border border-surface-700 rounded-md p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="WORD">Word (.docx)</option>
                        <option value="EXCEL">Excel (.xlsx)</option>
                      </select>
                    </div>
                  }
                  
                  <div class="pt-3 border-t border-surface-800">
                    <label class="text-[10px] text-gray-400 uppercase tracking-wide block mb-2">Permisos por Defecto</label>
                    @for (perm of selectedField.permisosPorDefecto || []; track $index; let pIdx = $index) {
                      <div class="bg-surface-800 p-2 rounded-md border border-surface-700 relative group/perm mb-2">
                        <button class="absolute -right-1 -top-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover/perm:opacity-100 transition-opacity" (click)="removePermission(pIdx)">
                          <svg class="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        <select [ngModel]="perm.role" (ngModelChange)="updatePermission(pIdx, {role: $event})" class="w-full bg-surface-900 border border-surface-700 rounded p-1 text-[10px] text-white focus:outline-none mb-1">
                          <option value="">Seleccione rol...</option>
                          @if (selectedField.type !== 'DOCUMENTO_COLABORATIVO') {
                            <option value="CLIENTE">CLIENTE (Solicitante)</option>
                          }
                          @for (depto of departamentos(); track depto.id) {
                            <option [value]="depto.id">{{ depto.nombre }}</option>
                          }
                        </select>
                        <select [ngModel]="perm.permission" (ngModelChange)="updatePermission(pIdx, {permission: $event})" class="w-full bg-surface-900 border border-surface-700 rounded p-1 text-[10px] text-white focus:outline-none">
                          <option value="LECTURA">LECTURA</option>
                          <option value="EDICION">EDICIÓN</option>
                          <option value="AMBOS">AMBOS</option>
                        </select>
                      </div>
                    }
                    <button class="w-full py-1.5 mt-1 border border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-md text-[10px] font-bold uppercase transition-colors" (click)="addPermission()">
                      + Añadir Permiso
                    </button>
                  </div>
                </div>
              }
              
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center px-4 opacity-40">
                <svg class="w-12 h-12 mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
                <p class="text-xs text-gray-300">Selecciona un elemento en el lienzo para ver y editar sus propiedades.</p>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class DragDropFormBuilderComponent {
  initialFields = input.required<FormFieldItem[]>();
  saveFields = output<FormFieldItem[]>();
  closeModal = output<void>();

  fields = signal<FormFieldItem[]>([]);
  selectedIndex = signal<number | null>(null);

  private readonly workflowState = inject(WorkflowStateService);
  readonly departamentos = this.workflowState.departamentos;

  paletteItems: PaletteItem[] = [
    { type: 'string', label: 'Texto', icon: '📝' },
    { type: 'number', label: 'Número', icon: '1️⃣' },
    { type: 'boolean', label: 'Checkbox', icon: '✅' },
    { type: 'date', label: 'Fecha', icon: '📅' },
    { type: 'datetime', label: 'Fecha y Hora', icon: '⏱️' },
    { type: 'grid', label: 'Grid / Tabla', icon: '📊' },
    { type: 'ARCHIVO_ESTATICO', label: 'Archivo Fijo', icon: '📎' },
    { type: 'DOCUMENTO_COLABORATIVO', label: 'Doc. Colaborativo', icon: '📝' }
  ];

  constructor() {
    effect(() => {
      // Initialize with a copy to not mutate parent directly until save
      const initial = this.initialFields();
      if (initial) {
        this.fields.set(JSON.parse(JSON.stringify(initial)));
      }
    }, { allowSignalWrites: true });
  }

  drop(event: CdkDragDrop<any>) {
    const list = this.fields();
    
    if (event.previousContainer === event.container) {
      // Reordering within the canvas
      moveItemInArray(list, event.previousIndex, event.currentIndex);
      this.fields.set([...list]);
      // Update selected index if necessary
      if (this.selectedIndex() === event.previousIndex) {
        this.selectedIndex.set(event.currentIndex);
      } else if (this.selectedIndex() !== null) {
        // Keep selection stable if other items move around it
        const s = this.selectedIndex()!;
        if (event.previousIndex < s && event.currentIndex >= s) {
          this.selectedIndex.set(s - 1);
        } else if (event.previousIndex > s && event.currentIndex <= s) {
          this.selectedIndex.set(s + 1);
        }
      }
    } else {
      // Dropping from palette
      const itemData = event.previousContainer.data[event.previousIndex] as PaletteItem;
      const newField: FormFieldItem = {
        key: `campo_${list.length + 1}_${Date.now().toString().slice(-4)}`,
        type: itemData.type,
        description: `Nuevo ${itemData.label}`,
        isRequired: false
      };

      // Set default properties based on type
      if (newField.type === 'grid') {
        newField.gridColumns = [
          { key: 'col_1', label: 'Columna 1', type: 'string' }
        ];
      } else if (newField.type === 'ARCHIVO_ESTATICO') {
        newField.formatosPermitidos = ['.pdf', '.jpg'];
        newField.tamanoMaximoMB = 5;
        newField.permisosPorDefecto = [{ role: 'CLIENTE', permission: 'LECTURA' }];
      } else if (newField.type === 'DOCUMENTO_COLABORATIVO') {
        newField.formatosPermitidos = ['WORD'];
        newField.permisosPorDefecto = [];
      }

      list.splice(event.currentIndex, 0, newField);
      this.fields.set([...list]);
      this.selectField(event.currentIndex); // Auto-select the newly dropped field
    }
  }

  selectField(index: number) {
    this.selectedIndex.set(index);
  }

  clearSelection() {
    this.selectedIndex.set(null);
  }

  removeField(index: number) {
    const list = [...this.fields()];
    list.splice(index, 1);
    this.fields.set(list);
    
    if (this.selectedIndex() === index) {
      this.selectedIndex.set(null);
    } else if (this.selectedIndex() !== null && this.selectedIndex()! > index) {
      this.selectedIndex.set(this.selectedIndex()! - 1);
    }
  }

  updateSelectedField(changes: Partial<FormFieldItem>) {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    list[idx] = { ...list[idx], ...changes };
    this.fields.set(list);
  }

  addGridColumn() {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    if (field.type !== 'grid') return;
    
    const cols = [...(field.gridColumns || [])];
    cols.push({ key: `col_${cols.length + 1}`, label: `Col ${cols.length + 1}`, type: 'string' });
    field.gridColumns = cols;
    this.fields.set(list);
  }

  updateGridColumn(cIdx: number, changes: Partial<GridColumn>) {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    if (field.type !== 'grid' || !field.gridColumns) return;
    
    field.gridColumns[cIdx] = { ...field.gridColumns[cIdx], ...changes };
    this.fields.set(list);
  }

  removeGridColumn(cIdx: number) {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    if (field.type !== 'grid' || !field.gridColumns) return;
    
    field.gridColumns.splice(cIdx, 1);
    this.fields.set(list);
  }

  toggleFileFormat(ext: string) {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    if (field.type !== 'ARCHIVO_ESTATICO') return;
    
    const current = field.formatosPermitidos || [];
    if (current.includes(ext)) {
      field.formatosPermitidos = current.filter(e => e !== ext);
    } else {
      field.formatosPermitidos = [...current, ext];
    }
    this.fields.set(list);
  }

  addPermission() {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    
    const perms = [...(field.permisosPorDefecto || [])];
    perms.push({ role: '', permission: 'LECTURA' });
    field.permisosPorDefecto = perms;
    this.fields.set(list);
  }

  updatePermission(pIdx: number, changes: Partial<PermissionSetting>) {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    if (!field.permisosPorDefecto) return;
    
    field.permisosPorDefecto[pIdx] = { ...field.permisosPorDefecto[pIdx], ...changes };
    this.fields.set(list);
  }

  removePermission(pIdx: number) {
    const idx = this.selectedIndex();
    if (idx === null) return;
    
    const list = [...this.fields()];
    const field = list[idx];
    if (!field.permisosPorDefecto) return;
    
    field.permisosPorDefecto.splice(pIdx, 1);
    this.fields.set(list);
  }

  save() {
    this.saveFields.emit(this.fields());
  }

  getIconForType(type: string): string {
    const item = this.paletteItems.find(p => p.type === type);
    return item ? item.icon : '📝';
  }

  getLabelForType(type: string): string {
    const item = this.paletteItems.find(p => p.type === type);
    return item ? item.label : 'Campo';
  }
}
