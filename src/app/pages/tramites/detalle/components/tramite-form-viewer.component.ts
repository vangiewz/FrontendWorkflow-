import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../shared/toast/toast.service';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-tramite-form-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass rounded-2xl p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-white">
             {{ step?.nombrePaso }}
             @if (isReadOnly) { <span class="ml-2 text-xs bg-surface-700 text-gray-300 px-2 py-1 rounded">Solo Lectura</span> }
          </h2>
          <p class="text-xs text-gray-400 mt-1">
            {{ step?.tipo === 'DECISION' ? 'Nodo de Decision' : 'Actividad' }} -
            {{ departamentoName }}
          </p>
        </div>
        @if (step?.tipo === 'DECISION') {
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><span class="text-amber-400 font-bold">?</span></div>
        } @else {
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><span class="text-blue-400 font-bold">?</span></div>
        }
      </div>

      @if (step?.tipo === 'DECISION') {
        @if (!isReadOnly) {
          @if (canRespond) {
            <div class="space-y-3">
              <p class="text-sm text-gray-300 mb-4">Seleccione la decision para continuar con el flujo:</p>
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
              <p class="text-xs text-gray-400 mt-1">No tienes permisos para tomar esta decision.</p>
            </div>
          }
        } @else {
          <div class="p-4 bg-surface-800 border border-surface-700 rounded-xl text-center">
            <p class="text-sm font-medium text-gray-400">Decision enviada:</p>
            <p class="text-lg font-bold text-violet-400 mt-1">{{ formAnswers['decision'] || 'N/A' }}</p>
          </div>
        }
      } @else {
        @if (!isReadOnly && !canRespond && !step?.departamentoId) {
          <div class="p-6 text-center bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <p class="text-sm font-medium text-violet-400">Esperando respuesta del Cliente</p>
            <p class="text-xs text-gray-400 mt-2">Este paso requiere intervencion del cliente a traves de la aplicacion movil.</p>
          </div>
        } @else {
          @if (!isReadOnly && !canRespond) {
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center mb-4">
              <p class="text-sm font-medium text-red-400">Paso asignado a: {{ departamentoName }}</p>
              <p class="text-xs text-gray-400 mt-1">No posees permisos para interactuar.</p>
            </div>
          }

          <div class="space-y-4" [class.opacity-60]="!canRespond && !isReadOnly">
            @if (!isReadOnly && canRespond && step?.tipo !== 'DECISION') {
              <div class="p-4 rounded-xl border border-violet-500/30 bg-violet-500/10 space-y-3">
                <p class="text-xs text-violet-200 font-semibold uppercase tracking-wide">Asistente IA</p>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    class="flex-1 bg-surface-900 border border-violet-400/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Describe por chat como llenar el formulario"
                    [value]="chatPrompt"
                    [disabled]="isAssisting"
                    (input)="chatPrompt = $any($event.target).value"
                  >
                  <button
                    type="button"
                    class="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-500 transition-colors disabled:opacity-50"
                    [disabled]="isAssisting"
                    (click)="solicitarAsistenciaChat()"
                  >
                    {{ isAssisting ? 'Procesando...' : 'Autocompletar' }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50"
                    [disabled]="isAssisting"
                    [class.border-rose-400]="isListening"
                    [class.text-rose-300]="isListening"
                    [class.bg-rose-500/20]="isListening"
                    [class.border-surface-600]="!isListening"
                    [class.text-gray-300]="!isListening"
                    [class.bg-surface-800]="!isListening"
                    (click)="toggleVoiceInput()"
                  >
                    {{ isListening ? 'Detener Voz' : 'Usar Voz' }}
                  </button>
                </div>
                <p class="text-[11px] text-violet-100/85">{{ voiceStatus }}</p>
              </div>
            }

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
                    <div class="w-full bg-surface-800 border border-surface-700 rounded-lg p-3 text-sm text-gray-300">
                      @if (field.type === 'grid') {
                        <div class="overflow-x-auto mt-2">
                           <table class="w-full text-left text-sm border-collapse border border-surface-700">
                             <thead>
                               <tr class="bg-surface-700">
                                 @for (col of getGridCols(field); track col.key) {
                                   <th class="p-2 border border-surface-600 font-medium text-gray-300">{{ col.label }}</th>
                                 }
                               </tr>
                             </thead>
                             <tbody>
                               @for (row of formData[field.key] || []; track $index) {
                                 <tr>
                                   @for (col of getGridCols(field); track col.key) {
                                     <td class="p-2 border border-surface-700 text-gray-400">
                                       @if (col.type === 'boolean') {
                                         <span class="px-2 py-0.5 rounded text-xs font-semibold"
                                               [class.bg-emerald-500/10]="row[col.key]"
                                               [class.text-emerald-400]="row[col.key]"
                                               [class.bg-rose-500/10]="!row[col.key]"
                                               [class.text-rose-400]="!row[col.key]">
                                           {{ row[col.key] ? 'Sí' : 'No' }}
                                         </span>
                                       } @else {
                                         {{ row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== '' ? row[col.key] : '-' }}
                                       }
                                     </td>
                                   }
                                 </tr>
                               }
                               @if (!formData[field.key] || formData[field.key].length === 0) {
                                 <tr>
                                   <td [attr.colspan]="getGridCols(field).length" class="p-4 text-center text-gray-500">Sin datos</td>
                                 </tr>
                               }
                             </tbody>
                           </table>
                        </div>
                      } @else {
                        {{ formattedAnswerValue(field.key, field.type) }}
                      }
                    </div>
                  } @else {
                    @if (field.type === 'textarea') {
                      <textarea
                        class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none"
                        [class.border-surface-700]="!field.required || formData[field.key]"
                        [class.border-red-500/40]="field.required && !formData[field.key]"
                        rows="3" [placeholder]="field.label"
                        [value]="formData[field.key] ?? ''"
                        [disabled]="!canRespond"
                        (input)="formData[field.key] = $any($event.target).value"
                      ></textarea>
                    } @else if (field.type === 'grid') {
                       <div class="border rounded-lg p-3 bg-surface-900/50 transition-all"
                            [class.border-surface-700]="!field.required || (formData[field.key] && formData[field.key].length > 0)"
                            [class.border-red-500/40]="field.required && (!formData[field.key] || formData[field.key].length === 0)">
                         <div class="overflow-x-auto">
                           <table class="w-full text-left text-sm text-gray-300">
                             <thead>
                               <tr>
                                 @for (col of getGridCols(field); track col.key) {
                                   <th class="pb-2 font-medium text-gray-400 px-1">{{ col.label }}</th>
                                 }
                                 <th class="pb-2 w-8"></th>
                               </tr>
                             </thead>
                             <tbody>
                               @for (row of formData[field.key] || []; track $index; let i = $index) {
                                 <tr class="border-t border-surface-700/50">
                                   @for (col of getGridCols(field); track col.key) {
                                     <td class="py-1 px-1">
                                       @if (col.type === 'boolean') {
                                         <div class="flex justify-center items-center py-1">
                                           <input type="checkbox"
                                                  class="w-4 h-4 rounded border-surface-600 text-purple-500 focus:ring-purple-500 bg-surface-700 cursor-pointer"
                                                  [checked]="!!row[col.key]"
                                                  (change)="row[col.key] = $any($event.target).checked; triggerChange()"
                                                  [disabled]="!canRespond">
                                         </div>
                                       } @else if (col.type === 'integer' || col.type === 'number') {
                                         <input type="number" class="w-full bg-surface-800 border border-surface-600 rounded px-2 py-1.5 text-xs focus:border-purple-500 focus:outline-none transition-colors text-white"
                                                [value]="row[col.key] ?? ''"
                                                (input)="row[col.key] = $any($event.target).value !== '' ? +$any($event.target).value : null; triggerChange()"
                                                [disabled]="!canRespond">
                                       } @else {
                                         <input type="text" class="w-full bg-surface-800 border border-surface-600 rounded px-2 py-1.5 text-xs focus:border-purple-500 focus:outline-none transition-colors text-white"
                                                [value]="row[col.key] || ''"
                                                (input)="row[col.key] = $any($event.target).value; triggerChange()"
                                                [disabled]="!canRespond">
                                       }
                                     </td>
                                   }
                                   <td class="py-1 px-1 text-center">
                                     @if (canRespond) {
                                       <button (click)="removeGridRow(field.key, i)" class="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                       </button>
                                     }
                                   </td>
                                 </tr>
                               }
                             </tbody>
                           </table>
                         </div>
                         @if (canRespond) {
                           <button (click)="addGridRow(field.key, field)" class="mt-3 flex items-center justify-center gap-1 w-full py-2 border border-dashed border-purple-500/30 rounded-lg text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all font-medium">
                             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                             Agregar fila
                           </button>
                         }
                       </div>
                    } @else if (field.type === 'select' && field.options) {
                      <select
                        class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all appearance-none"
                        [class.border-surface-700]="!field.required || formData[field.key]"
                        [class.border-red-500/40]="field.required && !formData[field.key]"
                        [value]="formData[field.key] ?? ''"
                        [disabled]="!canRespond"
                        (change)="formData[field.key] = $any($event.target).value"
                      >
                        <option value="">- Seleccione -</option>
                        @for (opt of field.options; track opt) { <option [value]="opt">{{ opt }}</option> }
                      </select>
                    } @else if (field.type === 'boolean') {
                      <label class="flex items-center gap-3 p-3 bg-surface-900 border border-surface-700 rounded-lg"
                        [class.cursor-pointer]="canRespond">
                        <input type="checkbox"
                          class="w-4 h-4 rounded border-surface-600 text-purple-500 focus:ring-purple-500 bg-surface-700"
                          [checked]="!!formData[field.key]"
                          [disabled]="!canRespond"
                          (change)="formData[field.key] = $any($event.target).checked">
                        <span class="text-sm text-gray-300">{{ field.label }}</span>
                      </label>
                    } @else if (field.type === 'ARCHIVO_ESTATICO') {
                      <div class="relative w-full">
                        @if (!uploadedFiles[field.key]) {
                          @if (uploadProgress[field.key] !== undefined) {
                            <div class="w-full bg-surface-800 rounded-lg p-4 border border-surface-700">
                               <p class="text-xs text-gray-400 mb-2">Subiendo documento...</p>
                               <div class="w-full bg-surface-900 rounded-full h-2.5">
                                  <div class="bg-purple-500 h-2.5 rounded-full transition-all duration-300" [style.width.%]="uploadProgress[field.key]"></div>
                               </div>
                               <p class="text-right text-xs text-purple-400 mt-1">{{ uploadProgress[field.key] }}%</p>
                            </div>
                          } @else {
                            <input
                              type="file"
                              class="w-full bg-surface-900 border rounded-lg p-2 text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer transition-all"
                              [class.border-surface-700]="!field.required || formData[field.key]"
                              [class.border-red-500/40]="field.required && !formData[field.key]"
                              [disabled]="!canRespond"
                              (change)="onStaticFileSelected($event, field)"
                            >
                          }
                        } @else {
                          <div class="flex flex-col gap-2">
                             @if (uploadProgress[field.key] !== undefined) {
                                <div class="w-full bg-surface-800 rounded-lg p-4 border border-surface-700 mb-2">
                                   <p class="text-xs text-gray-400 mb-2">Subiendo reemplazo...</p>
                                   <div class="w-full bg-surface-900 rounded-full h-2.5">
                                      <div class="bg-purple-500 h-2.5 rounded-full transition-all duration-300" [style.width.%]="uploadProgress[field.key]"></div>
                                   </div>
                                </div>
                             }
                             <div class="flex items-center justify-between bg-surface-800 border border-surface-700 p-3 rounded-xl shadow-sm">
                               <div class="flex items-center gap-3 overflow-hidden">
                                 <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                 </div>
                                 <div class="flex flex-col overflow-hidden">
                                    <button (click)="descargarArchivo(uploadedFiles[field.key])" class="text-sm font-medium text-gray-200 hover:text-emerald-400 truncate transition-colors cursor-pointer border-none bg-transparent p-0 text-left">{{ uploadedFiles[field.key].nombreOriginal || 'Archivo Cargado' }}</button>
                                    <span class="text-[10px] text-gray-500 font-mono">Versión {{ uploadedFiles[field.key].version || 1 }}</span>
                                 </div>
                               </div>
                               <div class="flex items-center gap-2 shrink-0">
                                  @if (historialMap[field.key] && historialMap[field.key].length > 0) {
                                     <button (click)="abrirHistorial(field.key)" class="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 hover:bg-surface-600 transition-colors border border-surface-600">Historial</button>
                                  }
                                  @if (canRespond && uploadProgress[field.key] === undefined) {
                                     <label class="cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors border border-purple-500/30">
                                        Reemplazar
                                        <input type="file" class="hidden" (change)="onStaticFileSelected($event, field)">
                                     </label>
                                  }
                               </div>
                             </div>
                          </div>
                        }
                      </div>
                    } @else if (field.type === 'DOCUMENTO_COLABORATIVO') {
                      <div class="relative w-full">
                        @if (!uploadedFiles[field.key]) {
                          <div class="flex items-center justify-between p-4 bg-surface-900 border border-surface-700 rounded-xl relative overflow-hidden group">
                            <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="flex items-center gap-4 relative z-10">
                              <div class="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner"
                                   [class.bg-blue-500/20]="field.type === 'DOCUMENTO_COLABORATIVO' && field.format === 'WORD'"
                                   [class.bg-emerald-500/20]="field.type === 'DOCUMENTO_COLABORATIVO' && field.format === 'EXCEL'">
                                 @if (field.type === 'DOCUMENTO_COLABORATIVO' && field.format === 'WORD') {
                                   <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 2H4.9C3.3 2 2 3.3 2 4.9v14.2C2 20.7 3.3 22 4.9 22h14.2c1.6 0 2.9-1.3 2.9-2.9V4.9C22 3.3 20.7 2 19.1 2zM15.8 17.6h-1.5l-1.9-6-1.9 6H9l-2.6-9.4h1.6l1.7 6.9 2-6.9h1.5l2 6.9 1.7-6.9h1.6l-2.7 9.4z"/></svg>
                                 } @else if (field.type === 'DOCUMENTO_COLABORATIVO' && field.format === 'EXCEL') {
                                   <svg class="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 2H4.9C3.3 2 2 3.3 2 4.9v14.2C2 20.7 3.3 22 4.9 22h14.2c1.6 0 2.9-1.3 2.9-2.9V4.9C22 3.3 20.7 2 19.1 2zM16.3 16.7h-1.7l-2.2-3.8-2.3 3.8H8.4l3.1-5-2.9-4.8h1.7l2 3.5 2.1-3.5h1.7l-3 4.9 3.2 4.9z"/></svg>
                                 }
                              </div>
                              <div>
                                <p class="text-sm font-semibold text-gray-200">Documento Colaborativo</p>
                                <p class="text-xs text-gray-400 mt-0.5">Pendiente de acción</p>
                              </div>
                            </div>
                            <button class="relative z-10 px-4 py-2 rounded-lg font-medium text-xs transition-colors flex items-center gap-2"
                                    [disabled]="!canRespond"
                                    [class.bg-purple-600]="canRespond"
                                    [class.text-white]="canRespond"
                                    [class.hover:bg-purple-500]="canRespond"
                                    [class.bg-surface-800]="!canRespond"
                                    [class.text-gray-500]="!canRespond"
                                    (click)="emitAbrirDocumento(field)">
                              Abrir Editor
                              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                          </div>
                        } @else {
                          <div class="flex items-center justify-between bg-surface-800 border border-surface-700 p-3 rounded-xl shadow-sm">
                             <div class="flex items-center gap-3 overflow-hidden">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                     [class.bg-blue-500/20]="field.format === 'WORD'"
                                     [class.bg-emerald-500/20]="field.format === 'EXCEL'">
                                   @if (field.format === 'WORD') {
                                     <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 2H4.9C3.3 2 2 3.3 2 4.9v14.2C2 20.7 3.3 22 4.9 22h14.2c1.6 0 2.9-1.3 2.9-2.9V4.9C22 3.3 20.7 2 19.1 2zM15.8 17.6h-1.5l-1.9-6-1.9 6H9l-2.6-9.4h1.6l1.7 6.9 2-6.9h1.5l2 6.9 1.7-6.9h1.6l-2.7 9.4z"/></svg>
                                   } @else {
                                     <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 2H4.9C3.3 2 2 3.3 2 4.9v14.2C2 20.7 3.3 22 4.9 22h14.2c1.6 0 2.9-1.3 2.9-2.9V4.9C22 3.3 20.7 2 19.1 2zM16.3 16.7h-1.7l-2.2-3.8-2.3 3.8H8.4l3.1-5-2.9-4.8h1.7l2 3.5 2.1-3.5h1.7l-3 4.9 3.2 4.9z"/></svg>
                                   }
                                </div>
                                <div class="flex flex-col overflow-hidden">
                                   <button (click)="descargarArchivo(uploadedFiles[field.key])" class="text-sm font-medium text-gray-200 hover:text-purple-400 truncate transition-colors cursor-pointer border-none bg-transparent p-0 text-left">{{ uploadedFiles[field.key].nombreOriginal || 'Documento Colaborativo' }}</button>
                                   <span class="text-[10px] text-gray-500 font-mono">Versión {{ uploadedFiles[field.key].version || 1 }}</span>
                                </div>
                             </div>
                             <div class="flex items-center gap-2 shrink-0">
                                @if (historialMap[field.key] && historialMap[field.key].length > 0) {
                                   <button (click)="abrirHistorial(field.key)" class="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 hover:bg-surface-600 transition-colors border border-surface-600">Historial</button>
                                }
                                @if (canRespond) {
                                   <button (click)="emitAbrirDocumento(field)" class="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors border border-purple-500/30">
                                      Editar
                                   </button>
                                }
                             </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <input
                        [type]="field.type || 'text'"
                        class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                        [class.border-surface-700]="!field.required || formData[field.key]"
                        [class.border-red-500/40]="field.required && !formData[field.key]"
                        [placeholder]="field.label + (field.required ? ' (obligatorio)' : '')"
                        [value]="formData[field.key] ?? ''"
                        [disabled]="!canRespond"
                        (input)="formData[field.key] = field.type === 'number' ? ($any($event.target).value !== '' ? +$any($event.target).value : null) : $any($event.target).value"
                        (change)="formData[field.key] = field.type === 'number' ? ($any($event.target).value !== '' ? +$any($event.target).value : null) : $any($event.target).value"
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

            @if (!isReadOnly && canRespond) {
              @if (!isFormValid()) {
                <p class="text-[11px] text-red-400/70 mt-2">* Complete todos los campos obligatorios</p>
              }
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

            @if (getDocumentosAdicionales().length > 0) {
               <div class="mt-6 border-t border-surface-700/50 pt-4">
                  <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Gestión Documental (Otros Archivos)</h3>
                  <div class="space-y-3">
                     @for (doc of getDocumentosAdicionales(); track doc.archivoId) {
                        <div class="flex items-center justify-between bg-surface-800 border border-surface-700 p-3 rounded-xl shadow-sm">
                           <div class="flex items-center gap-3 overflow-hidden">
                              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                   [class.bg-emerald-500/20]="!doc.esColaborativo"
                                   [class.bg-blue-500/20]="doc.esColaborativo && doc.formato === 'WORD'"
                                   [class.bg-emerald-500/20]="doc.esColaborativo && doc.formato === 'EXCEL'">
                                 @if (!doc.esColaborativo) {
                                   <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                 } @else if (doc.formato === 'WORD') {
                                   <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 2H4.9C3.3 2 2 3.3 2 4.9v14.2C2 20.7 3.3 22 4.9 22h14.2c1.6 0 2.9-1.3 2.9-2.9V4.9C22 3.3 20.7 2 19.1 2zM15.8 17.6h-1.5l-1.9-6-1.9 6H9l-2.6-9.4h1.6l1.7 6.9 2-6.9h1.5l2 6.9 1.7-6.9h1.6l-2.7 9.4z"/></svg>
                                 } @else {
                                   <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 2H4.9C3.3 2 2 3.3 2 4.9v14.2C2 20.7 3.3 22 4.9 22h14.2c1.6 0 2.9-1.3 2.9-2.9V4.9C22 3.3 20.7 2 19.1 2zM16.3 16.7h-1.7l-2.2-3.8-2.3 3.8H8.4l3.1-5-2.9-4.8h1.7l2 3.5 2.1-3.5h1.7l-3 4.9 3.2 4.9z"/></svg>
                                 }
                              </div>
                              <div class="flex flex-col overflow-hidden">
                                 <button (click)="descargarArchivo(doc)" class="text-sm font-medium text-gray-200 hover:text-purple-400 truncate transition-colors cursor-pointer border-none bg-transparent p-0 text-left">{{ doc.nombreOriginal || 'Documento Adjunto' }}</button>
                                 <div class="flex items-center gap-2 mt-0.5">
                                    <span class="text-[10px] text-gray-500 font-mono">Versión {{ doc.version || 1 }}</span>
                                    <span class="text-[10px] px-1.5 rounded-sm bg-surface-700 text-gray-400 capitalize">{{ doc.campoKey }}</span>
                                 </div>
                              </div>
                           </div>
                           <div class="flex items-center gap-2 shrink-0">
                              @if (historialMap[doc.campoKey] && historialMap[doc.campoKey].length > 0) {
                                 <button (click)="abrirHistorial(doc.campoKey)" class="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-gray-300 hover:bg-surface-600 transition-colors border border-surface-600">Historial</button>
                              }
                              @if (doc.esColaborativo) {
                                 <button (click)="emitAbrirDocumentoExistente(doc)" class="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors border border-purple-500/30">
                                    Abrir
                                 </button>
                              }
                           </div>
                        </div>
                     }
                  </div>
               </div>
            }

          </div>
        }
      }
    </div>

    @if (historialModalAbierto) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between mb-4">
             <h3 class="text-lg font-bold text-white">Historial de Versiones</h3>
             <button (click)="cerrarHistorial()" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
          </div>
          <div class="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             @for (doc of historialSeleccionado; track doc.version) {
               <div class="flex items-center justify-between p-3 bg-surface-800 rounded-xl border border-surface-700">
                  <div class="flex items-center gap-3 overflow-hidden">
                     <div class="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center shrink-0">
                        <span class="text-xs font-bold text-gray-300">v{{ doc.version }}</span>
                     </div>
                     <div class="flex flex-col overflow-hidden">
                        <span class="text-sm font-medium text-gray-200 truncate">{{ doc.nombreOriginal }}</span>
                        @if (doc.fechaSubida) {
                          <span class="text-[10px] text-gray-500">{{ doc.fechaSubida | date:'short' }}</span>
                        }
                     </div>
                  </div>
                  <button (click)="descargarArchivo(doc)" class="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-purple-400 hover:bg-surface-600 hover:text-purple-300 transition-colors border border-surface-600 shrink-0">Ver archivo</button>
               </div>
             }
             @if (historialSeleccionado.length === 0) {
                <p class="text-center text-sm text-gray-500 py-4">No hay versiones anteriores.</p>
             }
          </div>
        </div>
      </div>
    }
  `
})
export class TramiteFormViewerComponent implements OnChanges {
  private static readonly VOICE_UNSUPPORTED = 'VOICE_UNSUPPORTED';
  private static readonly VOICE_ERROR_PREFIX = 'VOICE_ERROR:';

  @Input() tramiteId = '';
  @Input() documentos: any[] = [];
  @Input() step: any = null;
  @Input() departamentoName = '';
  @Input() isReadOnly = false;
  @Input() canRespond = false;
  @Input() formAnswers: Record<string, any> = {};
  @Input() isSubmitting = false;
  @Input() iaPrefill: Record<string, unknown> | null = null;
  @Input() isAssisting = false;

  @Output() opcionSeleccionada = new EventEmitter<string>();
  @Output() formularioEnviado = new EventEmitter<Record<string, any>>();
  @Output() asistenciaSolicitada = new EventEmitter<{ modo: 'chat' | 'voz'; mensaje: string }>();
  @Output() abrirDocumento = new EventEmitter<{key: string, type: string, format: string, permisos: any}>();

  formData: Record<string, any> = {};
  formFields: any[] = [];
  chatPrompt = '';
  isListening = false;
  voiceStatus = 'Pulsa "Usar Voz" y habla despues de ver "Escuchando".';
  
  uploadProgress: { [key: string]: number } = {};
  uploadedFiles: { [key: string]: any } = {};
  historialMap: { [key: string]: any[] } = {};
  historialModalAbierto = false;
  historialSeleccionado: any[] = [];
  campoSeleccionadoHistorial = '';

  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);

  private speechRecognition: {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onstart: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['step']) {
      this.formData = {};
      this.formFields = this.step?.formularioJson ? this.buildFormFields(this.step.formularioJson) : [];
      this.chatPrompt = '';
      this.voiceStatus = 'Pulsa "Usar Voz" y habla despues de ver "Escuchando".';
      this.stopListening();
    }
    if (changes['documentos']) {
      this.procesarDocumentosEstaticos();
    }
    if (changes['isReadOnly'] && this.isReadOnly && this.formAnswers) {
      this.formData = { ...this.formAnswers };
    }
    if (changes['formAnswers'] && this.isReadOnly) {
      this.formData = { ...this.formAnswers };
    }
    if (changes['iaPrefill'] && this.iaPrefill && !this.isReadOnly) {
      this.aplicarSugerencia(this.iaPrefill);
    }
  }

  private procesarDocumentosEstaticos() {
    this.uploadedFiles = {};
    this.historialMap = {};
    if (!this.documentos || this.documentos.length === 0) return;

    // Agrupar por campoKey
    for (const doc of this.documentos) {
      const key = doc.campoKey;
      if (!key) continue;

      if (!this.historialMap[key]) {
        this.historialMap[key] = [];
      }
      this.historialMap[key].push(doc);
    }

    // Ordenar y seleccionar el último para cada campo
    for (const key of Object.keys(this.historialMap)) {
      this.historialMap[key].sort((a: any, b: any) => b.version - a.version); // Descendente
      if (this.historialMap[key].length > 0) {
        this.uploadedFiles[key] = this.historialMap[key][0];
        // Ensure formData is populated so isFormValid() passes when required
        this.formData[key] = this.uploadedFiles[key];
        // Quitar el último del historial para que el historial sólo tenga las versiones previas
        this.historialMap[key] = this.historialMap[key].slice(1);
      }
    }
  }

  descargarArchivo(doc: any) {
    if (!doc || !doc.archivoId) return;
    const url = `${environment.apiUrl}/documentos/${doc.archivoId}/descargar`;
    
    let headers = new HttpHeaders();
    if (this.departamentoName) {
      headers = headers.set('X-Departamento-Solicitante', this.departamentoName);
    }
    
    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.nombreOriginal || 'documento';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => {
        console.error('Error al descargar', err);
        this.toast.error('Error al descargar el archivo. Verifica permisos.');
      }
    });
  }

  submitForm() {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.formularioEnviado.emit({ ...this.formData });
  }

  emitAbrirDocumento(field: any) {
    if (!this.canRespond) return;
    this.abrirDocumento.emit({
      key: field.key,
      type: field.type,
      format: field.format || 'WORD',
      permisos: field.permisosPorDefecto || {}
    });
  }

  emitAbrirDocumentoExistente(doc: any) {
    this.abrirDocumento.emit({
      key: doc.campoKey,
      type: 'DOCUMENTO_COLABORATIVO',
      format: doc.formato || 'WORD',
      permisos: doc.permisos || {}
    });
  }

  getDocumentosAdicionales(): any[] {
    if (!this.documentos) return [];
    
    // keys ya mostrados en el formulario actual
    const keysEnFormulario = this.formFields.map(f => f.key);
    
    const user = this.authService.getUser();
    if (!user) return [];
    
    const result: any[] = [];
    
    for (const key of Object.keys(this.uploadedFiles)) {
      if (keysEnFormulario.includes(key)) continue; // ya está en el form actual
      
      const doc = this.uploadedFiles[key];
      
      // Chequear permisos
      let hasAccess = false;
      if (user.rol === 'ADMIN' || user.rol === 'CLIENTE') {
         hasAccess = true;
      } else {
         const deptoPerm = doc.permisos ? doc.permisos[user.departamentoId || ''] : null;
         const rolPerm = doc.permisos ? doc.permisos[user.rol || ''] : null;
         if (deptoPerm === 'LECTURA' || deptoPerm === 'EDICION' || deptoPerm === 'AMBAS') hasAccess = true;
         if (rolPerm === 'LECTURA' || rolPerm === 'EDICION' || rolPerm === 'AMBAS') hasAccess = true;
      }
      
      if (hasAccess) {
         result.push(doc);
      }
    }
    
    return result;
  }

  solicitarAsistenciaChat() {
    const mensaje = this.chatPrompt.trim();
    if (!mensaje || this.isReadOnly || !this.canRespond || this.isAssisting) return;
    this.voiceStatus = 'Procesando solicitud por chat con IA...';
    this.asistenciaSolicitada.emit({ modo: 'chat', mensaje });
  }

  triggerChange() {
    this.formData = { ...this.formData }; // Force angular CD check if needed
  }

  toggleVoiceInput() {
    if (this.isReadOnly || !this.canRespond || this.isAssisting) {
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    const recognition = this.createSpeechRecognition();
    if (!recognition) {
      this.asistenciaSolicitada.emit({ modo: 'voz', mensaje: TramiteFormViewerComponent.VOICE_UNSUPPORTED });
      return;
    }

    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.voiceStatus = 'Escuchando... habla ahora y luego pulsa "Detener Voz".';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      this.chatPrompt = transcript;
      const clean = transcript.trim();
      if (clean) {
        this.voiceStatus = 'Procesando transcripcion con IA...';
        this.asistenciaSolicitada.emit({ modo: 'voz', mensaje: clean });
      }
    };

    recognition.onerror = (event) => {
      this.isListening = false;
      this.speechRecognition = null;
      const errorCode = event.error ?? 'unknown';
      this.voiceStatus = 'No se pudo capturar audio. Revisa permisos de microfono e intentalo de nuevo.';
      this.asistenciaSolicitada.emit({
        modo: 'voz',
        mensaje: `${TramiteFormViewerComponent.VOICE_ERROR_PREFIX}${errorCode}`
      });
    };

    recognition.onend = () => {
      this.isListening = false;
      this.speechRecognition = null;
      if (!this.isAssisting) {
        this.voiceStatus = 'Voz detenida. Puedes grabar de nuevo o usar chat.';
      }
    };

    this.speechRecognition = recognition;
    this.isListening = true;
    try {
      recognition.start();
    } catch {
      this.isListening = false;
      this.speechRecognition = null;
      this.voiceStatus = 'No se pudo iniciar el reconocimiento de voz en este navegador.';
      this.asistenciaSolicitada.emit({ modo: 'voz', mensaje: TramiteFormViewerComponent.VOICE_UNSUPPORTED });
    }
  }

  getDecisionOpciones(paso: any): string[] {
    return paso?.siguientes ? Object.keys(paso.siguientes) : [];
  }

  formattedAnswerValue(key: string, type: string): string {
    const val = this.formData[key];
    if (val === undefined || val === null || val === '') return 'N/A';
    if (type === 'boolean') return val ? 'Si' : 'No';
    return val.toString();
  }

  getGridCols(field: any): any[] {
    if (!field.gridSchema) return [];
    return Object.keys(field.gridSchema).map(k => ({
      key: k,
      label: field.gridSchema[k].title || field.gridSchema[k].description || k,
      type: field.gridSchema[k].type || 'string'
    }));
  }

  buildFormFields(schema: Record<string, any>): any[] {
    if (!schema || !schema['properties']) return [];
    const props = schema['properties'] as Record<string, any>;
    const requiredFields: string[] = schema['required'] || [];
    return Object.entries(props).map(([key, val]) => {
      let type = 'text';
      let gridSchema = null;
      
      if (val?.type === 'boolean') {
        type = 'boolean';
      } else if (val?.type === 'integer' || val?.type === 'number') {
        type = 'number';
      } else if (val?.type === 'date' || (val?.type === 'string' && val?.format === 'date')) {
        type = 'date';
      } else if (val?.type === 'date-time' || val?.type === 'datetime' || (val?.type === 'string' && val?.format === 'date-time')) {
        type = 'datetime-local';
      } else if (val?.type === 'array' || val?.type === 'grid') {
        type = 'grid';
        gridSchema = val?.items?.properties || {};
      } else if (val?.type === 'string') {
        if (val?.enum) type = 'select';
        else if (val?.format === 'date') type = 'date';
        else if (val?.format === 'date-time') type = 'datetime-local';
        else if (val?.format === 'textarea') type = 'textarea';
        else type = 'text';
      } else if (val?.type === 'ARCHIVO_ESTATICO' || val?.type === 'DOCUMENTO_COLABORATIVO') {
        type = val.type;
      }
      
      let format = 'WORD';
      if (type === 'DOCUMENTO_COLABORATIVO' && val?.formatosPermitidos && val.formatosPermitidos.length > 0) {
        format = val.formatosPermitidos[0];
      }
      
      let acceptString = '';
      if (type === 'ARCHIVO_ESTATICO' && val?.formatosPermitidos && val.formatosPermitidos.length > 0) {
        acceptString = val.formatosPermitidos.join(',');
      }

      return {
        key,
        label: val?.title || val?.description || key,
        type,
        format,
        formatosPermitidos: val?.formatosPermitidos,
        tamanoMaximoMB: val?.tamanoMaximoMB,
        acceptString,
        permisosPorDefecto: val?.permisosPorDefecto,
        required: requiredFields.includes(key),
        options: val?.enum,
        gridSchema
      };
    });
  }

  isFormValid(): boolean {
    const schema = this.step?.formularioJson;
    if (!schema || !schema['required']) return true;
    const requiredFields: string[] = schema['required'];
    return requiredFields.every((key) => {
      const val = this.formData[key];
      const field = this.formFields.find(f => f.key === key);
      if (field && field.type === 'grid') {
        return val && Array.isArray(val) && val.length > 0;
      } else {
        return val !== undefined && val !== null && val !== '';
      }
    });
  }

  addGridRow(key: string, field: any) {
    if (!this.formData[key]) {
      this.formData[key] = [];
    }
    const newRow: any = {};
    const cols = this.getGridCols(field);
    cols.forEach(c => {
      newRow[c.key] = c.type === 'boolean' ? false : (c.type === 'number' ? null : '');
    });
    this.formData[key] = [...this.formData[key], newRow];
  }

  removeGridRow(key: string, index: number) {
    if (!this.formData[key]) return;
    const arr = [...this.formData[key]];
    arr.splice(index, 1);
    this.formData[key] = arr;
  }

  onStaticFileSelected(event: any, field: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (field.tamanoMaximoMB) {
      const maxSize = field.tamanoMaximoMB * 1024 * 1024;
      if (file.size > maxSize) {
        event.target.value = '';
        this.toast.error(`El archivo supera el límite de ${field.tamanoMaximoMB} MB.`);
        return;
      }
    }

    if (field.formatosPermitidos && field.formatosPermitidos.length > 0) {
      const originalName = file.name || '';
      const dotIndex = originalName.lastIndexOf('.');
      const ext = dotIndex > 0 ? originalName.substring(dotIndex).toLowerCase() : '';
      if (!field.formatosPermitidos.includes(ext)) {
        event.target.value = '';
        this.toast.error(`Formato ${ext || 'desconocido'} no permitido. Use: ${field.formatosPermitidos.join(', ')}`);
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('campoKey', field.key);
    formData.append('pasoId', this.step.id);

    this.uploadProgress[field.key] = 1;

    this.http.post(`${environment.apiUrl}/tramites/${this.tramiteId}/documentos/upload-estatico`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (httpEvent: any) => {
        if (httpEvent.type === 1) { // HttpEventType.UploadProgress
          this.uploadProgress[field.key] = Math.round(100 * httpEvent.loaded / (httpEvent.total || file.size));
          this.cdr.markForCheck();
          this.triggerChange();
        } else if (httpEvent.type === 4) { // HttpEventType.Response
          const prev = this.uploadedFiles[field.key];
          if (prev && prev.archivoId) {
            if (!this.historialMap[field.key]) this.historialMap[field.key] = [];
            this.historialMap[field.key].unshift(prev);
          }
          this.uploadedFiles[field.key] = httpEvent.body;
          this.formData[field.key] = httpEvent.body; // Mark field as filled
          delete this.uploadProgress[field.key];
          this.toast.success('Archivo cargado exitosamente.');
          this.cdr.markForCheck();
          this.triggerChange();
        }
      },
      error: (err: any) => {
        delete this.uploadProgress[field.key];
        event.target.value = '';
        this.toast.error(err.error?.error || 'Error al subir el archivo');
        this.triggerChange();
      }
    });
  }

  abrirHistorial(key: string) {
    this.campoSeleccionadoHistorial = key;
    this.historialSeleccionado = this.historialMap[key] || [];
    this.historialModalAbierto = true;
  }

  cerrarHistorial() {
    this.historialModalAbierto = false;
    this.historialSeleccionado = [];
  }

  clearStaticFile(key: string) {
    // Ya no se eliminan físicamente. Sólo limpiamos si es necesario, pero en la nueva arquitectura
    // el botón será "Reemplazar". Por lo que clearStaticFile podría ser obsoleto.
    // Lo dejamos para cuando se necesite reiniciar el input localmente si falla.
    delete this.formData[key];
    this.triggerChange();
  }

  private createSpeechRecognition(): {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onstart: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null {
    const maybeWindow = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: ((event: { error?: string }) => void) | null;
        onstart: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: ((event: { error?: string }) => void) | null;
        onstart: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const Ctor = maybeWindow.SpeechRecognition ?? maybeWindow.webkitSpeechRecognition;
    if (!Ctor) {
      return null;
    }
    return new Ctor();
  }

  private stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
    }
    this.isListening = false;
    this.speechRecognition = null;
    this.voiceStatus = 'Voz detenida. Puedes grabar de nuevo o usar chat.';
  }

  private aplicarSugerencia(sugerencia: Record<string, unknown>) {
    let changed = false;
    for (const field of this.formFields) {
      const key = String(field.key);
      if (Object.prototype.hasOwnProperty.call(sugerencia, key)) {
        this.formData[key] = sugerencia[key];
        changed = true;
      }
    }
    if (changed) {
      this.triggerChange();
    }
  }
}
