import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisorDocumentoComponent } from '../../components/visor-documento/visor-documento.component';

@Component({
  selector: 'app-visor-documento-modal',
  standalone: true,
  imports: [CommonModule, VisorDocumentoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop Blur -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-md" (click)="close.emit()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-surface-900 border border-surface-700 shadow-2xl rounded-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-4 border-b border-surface-800 bg-surface-900 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-white tracking-wide">Editor Colaborativo</h3>
                <p class="text-xs text-purple-300">Sala en Tiempo Real • {{ formato }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button class="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/50 flex items-center gap-2"
                      (click)="guardarYCerrar()">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                Guardar y Cerrar
              </button>
              <button class="p-2 text-gray-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors" (click)="close.emit()" title="Minimizar / Cerrar sin guardar explícitamente">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </header>
          
          <!-- Editor Area -->
          <div class="flex-1 overflow-hidden relative bg-surface-950 flex">
            <app-visor-documento class="flex-1 w-full h-full"
              #visorComponent
              [tramiteId]="tramiteId"
              [campoConfig]="campoConfig"
              [archivoMetadata]="archivoMetadata"
              [rolUsuario]="rolUsuario"
              [departamentoUsuario]="departamentoUsuario"
              [forceReadOnly]="isReadOnly">
            </app-visor-documento>
          </div>
        </div>
      </div>
    }
  `
})
export class VisorDocumentoModalComponent {
  @Input() isOpen = false;
  @Input() tramiteId!: string;
  @Input() campoConfig!: any;
  @Input() archivoMetadata!: any;
  @Input() formato = 'WORD';
  @Input() rolUsuario = '';
  @Input() departamentoUsuario = '';
  @Input() isReadOnly = false;

  @Output() close = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<any>();

  @ViewChild('visorComponent') visorComponent!: VisorDocumentoComponent;

  guardarYCerrar() {
    if (this.visorComponent) {
      const saveObs = this.visorComponent.finalizarEdicion();
      if (saveObs) {
        saveObs.subscribe({
          next: (res) => {
            // Emitimos la metadata realzada proveniente del servidor (que ya tiene nueva versión o url)
            this.guardado.emit(res);
            this.close.emit();
          },
          error: (err) => {
            alert('❌ Error crítico al intentar guardar el documento.');
          }
        });
      } else {
        this.close.emit();
      }
    } else {
      this.close.emit();
    }
  }
}
