import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { S3StorageService } from '../../../../services/s3-storage.service';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../shared/toast/toast.service';

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
                          <div class="flex justify-between gap-4 py-2 items-center border-b border-surface-800/50 last:border-0">
                            <span class="text-xs text-gray-400 capitalize">{{ entry[0] }}:</span>
                            @if (isUrl(entry[1])) {
                               <button (click)="descargarArchivo(entry[1])"
                                  [disabled]="isDownloading"
                                  class="text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                 @if (isDownloading) {
                                    <div class="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                                    Descargando...
                                 } @else {
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    {{ getFileName(entry[1]) }}
                                 }
                               </button>
                            } @else {
                               <span class="text-xs text-gray-200 text-right font-medium truncate max-w-[200px]">{{ entry[1] }}</span>
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
  @Input() documentos: any[] = [];
  
  @Output() close = new EventEmitter<void>();

  private readonly s3Storage = inject(S3StorageService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  isDownloading = false;

  hasKeys(obj: Record<string, any>): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  objectEntries(obj: Record<string, any>): [string, any][] {
    return Object.entries(obj || {});
  }

  isUrl(val: any): boolean {
    return typeof val === 'string' && (val.startsWith('http') || val.startsWith('repositorios_clientes/'));
  }

  isS3Path(val: any): boolean {
    return typeof val === 'string' && val.startsWith('repositorios_clientes/');
  }

  getFileName(val: string): string {
    if (this.isS3Path(val)) {
       const doc = this.documentos?.find(d => d.rutaS3 === val);
       if (doc) return doc.nombreOriginal || 'Archivo adjunto';
       return val.split('/').pop() || 'Archivo adjunto';
    }
    return 'Ver Archivo';
  }

  descargarArchivo(val: string) {
    if (!this.isS3Path(val)) {
      window.open(val, '_blank', 'noopener,noreferrer');
      return;
    }

    const doc = this.documentos?.find(d => d.rutaS3 === val);
    if (!doc) {
       this.toast.error('Archivo no encontrado en los metadatos.');
       return;
    }

    this.isDownloading = true;
    const user = this.authService.getUser();
    this.s3Storage.descargarDocumento(doc.archivoId, user?.rol, user?.departamentoId ?? undefined).subscribe({
      next: (blob) => {
        this.isDownloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nombreOriginal || 'documento';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Archivo descargado correctamente');
      },
      error: () => {
        this.isDownloading = false;
        this.toast.error('No tienes permisos para descargar este archivo o hubo un error.');
      }
    });
  }
}
