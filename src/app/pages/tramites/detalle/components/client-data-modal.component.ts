import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-data-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn p-4" (click)="close.emit()">
        
        <!-- Modal Panel -->
        <div class="w-full max-w-md bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl flex flex-col pointer-events-auto" (click)="$event.stopPropagation()">
          
          <div class="p-6 border-b border-surface-800 flex items-center justify-between">
             <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                   <svg class="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <h3 class="text-lg font-bold text-white tracking-wide">Datos del Iniciador</h3>
             </div>
             <button (click)="close.emit()" class="text-gray-500 hover:text-white transition-colors cursor-pointer">
               <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
          </div>

          <div class="p-6 space-y-4">
            @if (loading) {
               <div class="flex justify-center p-4">
                  <div class="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
            } @else if (clientInfo) {
               <!-- Ficha de Contacto Principal -->
               <div class="p-4 bg-surface-800 rounded-xl space-y-3">
                  <div class="flex justify-between border-b border-surface-700 pb-2 border-dashed">
                     <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Nombre</span>
                     <span class="text-sm text-gray-200 font-medium">{{ clientInfo['nombre'] || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between border-b border-surface-700 pb-2 border-dashed">
                     <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Correo</span>
                     <span class="text-sm text-gray-200">{{ clientInfo['email'] || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                     <span class="text-xs text-gray-500 uppercase font-bold tracking-wider">Teléfono</span>
                     <span class="text-sm text-gray-200">{{ clientInfo['telefono'] || 'N/A' }}</span>
                  </div>
               </div>
               
               <!-- Formulario Creado Opcional -->
               @if (initialForm && hasKeys(initialForm)) {
                  <div class="mt-6">
                    <h4 class="text-xs text-violet-400 uppercase font-bold tracking-wider mb-3">Datos del Formulario Inicial</h4>
                    <div class="glass p-4 rounded-xl space-y-2 border border-violet-500/10">
                       @for (entry of objectEntries(initialForm); track entry[0]) {
                          <div class="flex justify-between gap-4 py-1 items-center">
                            <span class="text-xs text-gray-400 capitalize">{{ entry[0] }}:</span>
                            @if (isUrl(entry[1])) {
                               <a [href]="entry[1]" target="_blank" rel="noopener noreferrer" 
                                  class="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                                 <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                 Ver Archivo
                               </a>
                            } @else {
                               <span class="text-xs text-gray-200 text-right font-medium truncate">{{ entry[1] }}</span>
                            }
                          </div>
                       }
                    </div>
                  </div>
               }
            } @else {
               <p class="text-center text-sm text-gray-500">Error: No se pudo obtener la información de la cuenta origen.</p>
            }
          </div>

          <div class="p-4 bg-surface-950/50 rounded-b-2xl border-t border-surface-800 flex justify-end">
             <button (click)="close.emit()" class="px-5 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-sm font-medium text-white transition-colors">Cerrar</button>
          </div>

        </div>
      </div>
    }
  `
})
export class ClientDataModalComponent {
  @Input() isOpen = false;
  @Input() loading = false;
  @Input() clientInfo: Record<string, any> | null = null;
  @Input() initialForm: Record<string, any> | null = null;
  
  @Output() close = new EventEmitter<void>();

  hasKeys(obj: Record<string, any>): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  objectEntries(obj: Record<string, any>): [string, any][] {
    return Object.entries(obj || {});
  }

  isUrl(val: any): boolean {
    return typeof val === 'string' && val.startsWith('http');
  }
}
