import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DocumentoGestionDTO } from '../gestion-documental.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface DocumentoPorTramite {
  tramiteNombre: string;
  fechaCreacion: string;
  tramiteFechaCreacion: string;
  documentos: DocumentoGestionDTO[];
}

interface DocumentoPorCliente {
  clienteNombre: string;
  tramites: Map<string, DocumentoPorTramite>;
}

@Component({
  selector: 'app-gestion-documental-lista',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      @for (cliente of clientesAgrupados.values(); track cliente.clienteNombre) {
        <details class="group bg-surface-800 rounded-xl border border-surface-700 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary class="flex items-center justify-between px-6 py-4 cursor-pointer bg-surface-900/50 hover:bg-surface-700/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                {{ cliente.clienteNombre.charAt(0) | uppercase }}
              </div>
              <span class="text-lg font-semibold text-white">{{ cliente.clienteNombre }}</span>
            </div>
            <svg class="w-5 h-5 text-gray-400 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          
          <div class="p-4 space-y-3 bg-surface-800">
            @for (tramite of cliente.tramites.entries(); track tramite[0]) {
              <details class="group/tramite bg-surface-900 rounded-lg border border-surface-700 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary class="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-surface-800 transition-colors">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span class="font-medium text-gray-200 block">{{ tramite[1].tramiteNombre }}</span>
                      <span class="text-[11px] text-gray-400 font-mono tracking-wider bg-surface-800 px-1.5 py-0.5 rounded border border-surface-600 mt-1 inline-block">
                        Iniciado: {{ formatLocalDateTime(tramite[1].tramiteFechaCreacion) | date:'dd/MMM/yyyy HH:mm' }}
                      </span>
                    </div>
                  </div>
                  <svg class="w-4 h-4 text-gray-500 transform group-open/tramite:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div class="overflow-x-auto border-t border-surface-700">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-surface-950/50 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        <th class="px-5 py-3 border-b border-surface-700 w-[40%]">Documento</th>
                        <th class="px-5 py-3 border-b border-surface-700 w-[20%]">Paso del Flujo</th>
                        <th class="px-5 py-3 border-b border-surface-700 w-[40%] text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-surface-800">
                      @for (doc of tramite[1].documentos; track doc.archivoId) {
                        @if (!doc.esColaborativo || (doc.extension !== 'WORD' && doc.extension !== 'EXCEL')) {
                          <tr class="hover:bg-surface-700/30 transition-colors">
                            <td class="px-5 py-3">
                              <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                     [ngClass]="{
                                       'bg-rose-500/10 text-rose-400': doc.extension === 'PDF',
                                       'bg-blue-500/10 text-blue-400': doc.extension === 'WORD',
                                       'bg-emerald-500/10 text-emerald-400': doc.extension === 'EXCEL',
                                       'bg-gray-500/10 text-gray-400': doc.extension === 'OTRO' || doc.extension === 'IMAGEN'
                                     }">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                     <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div class="flex flex-col overflow-hidden">
                                   <button (click)="descargarArchivo(doc)" class="text-sm font-medium text-gray-200 hover:text-emerald-400 truncate transition-colors cursor-pointer border-none bg-transparent p-0 text-left flex items-center gap-2" [title]="doc.nombreOriginal || 'Archivo Cargado'">
                                     {{ doc.nombreOriginal || 'Archivo Cargado' }}
                                     @if (isDownloading.get(doc.archivoId)) {
                                       <svg class="w-3.5 h-3.5 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                     }
                                   </button>
                                   <div class="flex items-center gap-2 mt-0.5">
                                     <span class="text-[11px] text-gray-400">Versión {{ doc.historialVersiones ? doc.historialVersiones.length + 1 : 1 }}</span>
                                     <span class="text-[11px] text-gray-500">•</span>
                                     <span class="text-[11px] text-gray-400">{{ formatLocalDateTime(doc.fechaCreacion) | date:'dd/MM/yyyy HH:mm' }}</span>
                                   </div>
                                   @if (uploadProgress.get(doc.archivoId) !== undefined) {
                                      <div class="w-full max-w-[200px] mt-2">
                                         <p class="text-[10px] text-gray-400 mb-1">Subiendo reemplazo...</p>
                                         <div class="w-full bg-surface-900 rounded-full h-1.5 border border-surface-700">
                                            <div class="bg-purple-500 h-1.5 rounded-full transition-all duration-300" [style.width.%]="uploadProgress.get(doc.archivoId)"></div>
                                         </div>
                                         <p class="text-right text-[10px] text-purple-400 mt-0.5">{{ uploadProgress.get(doc.archivoId) }}%</p>
                                      </div>
                                   }
                                </div>
                              </div>
                            </td>
                            <td class="px-5 py-3">
                              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-900 border border-surface-600 text-xs font-medium text-gray-300">
                                {{ doc.pasoNombre }}
                              </span>
                            </td>
                            <td class="px-5 py-3 text-right">
                              <div class="flex items-center justify-end gap-2">
                                 @if (doc.historialVersiones && doc.historialVersiones.length > 0) {
                                    <button (click)="abrirHistorial(doc)" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-600 transition-colors">
                                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      Historial
                                    </button>
                                 }
                                 @if (doc.editable && uploadProgress.get(doc.archivoId) === undefined) {
                                    <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20">
                                       Reemplazar
                                       <input type="file" class="hidden" (change)="onStaticFileSelected($event, doc)">
                                    </label>
                                 }
                                 <button (click)="descargarArchivo(doc)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20" [disabled]="isDownloading.get(doc.archivoId)">
                                   Descargar
                                 </button>
                              </div>
                            </td>
                          </tr>
                        } @else {
                          <tr class="hover:bg-surface-700/30 transition-colors">
                            <td class="px-5 py-3">
                              <div class="flex items-center gap-3">
                                <!-- Icono según extensión -->
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                     [ngClass]="{
                                       'bg-blue-500/10 text-blue-400': $any(doc).extension === 'WORD',
                                       'bg-emerald-500/10 text-emerald-400': $any(doc).extension === 'EXCEL',
                                       'bg-rose-500/10 text-rose-400': $any(doc).extension === 'PDF',
                                       'bg-gray-500/10 text-gray-400': $any(doc).extension === 'OTRO' || $any(doc).extension === 'IMAGEN'
                                     }">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p class="text-sm font-medium text-white truncate max-w-[200px]" [title]="doc.nombreOriginal">
                                    {{ doc.nombreOriginal }}
                                  </p>
                                  <p class="text-xs text-gray-400 mt-0.5">Versión actual • {{ formatLocalDateTime(doc.fechaCreacion) | date:'dd/MM/yyyy HH:mm' }}</p>
                                </div>
                              </div>
                            </td>
                            <td class="px-5 py-3">
                              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-900 border border-surface-600 text-xs font-medium text-gray-300">
                                {{ doc.pasoNombre }}
                              </span>
                            </td>
                            <td class="px-5 py-3 text-right">
                              <div class="flex items-center justify-end gap-2">
                                @if (doc.historialVersiones && doc.historialVersiones.length > 0) {
                                  <button (click)="abrirHistorial(doc)" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-600 transition-colors">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Historial
                                  </button>
                                }
                                  <button (click)="verDocumento.emit(doc)" 
                                          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                          [ngClass]="doc.editable ? 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20' : 'bg-surface-700 text-gray-300 hover:bg-surface-600'">
                                    @if (doc.editable) {
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                      Editar / Ver
                                    } @else {
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Ver (Solo Lectura)
                                    }
                                  </button>
                              </div>
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </details>
            }
          </div>
        </details>
      } @empty {
        <div class="bg-surface-800 rounded-xl border border-surface-700 p-12 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-900 mb-3">
            <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-sm font-medium text-white">No hay documentos</h3>
          <p class="text-sm text-gray-400 mt-1">No se encontraron documentos en esta categoría.</p>
        </div>
      }
    </div>

    <!-- Modal Historial -->
    @if (historialActivo) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-surface-800 border border-surface-600 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between px-6 py-4 border-b border-surface-700 bg-surface-900/50">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial de Versiones
            </h3>
            <button (click)="cerrarHistorial()" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-6 max-h-[60vh] overflow-y-auto">
            <p class="text-sm text-gray-400 mb-4 font-medium">{{ historialActivo.nombreOriginal }}</p>
            
            <div class="space-y-3">
              @for (version of historialActivo.historialVersiones; track version.archivoId) {
                <div class="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-700 hover:border-surface-500 transition-colors">
                  <div>
                    <p class="text-sm font-medium text-white">Versión {{ version.version || 'Anterior' }}</p>
                    <p class="text-xs text-gray-500">{{ version.nombreOriginal }}</p>
                  </div>
                  @if (!version.esColaborativo) {
                    <button class="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-gray-300 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-2"
                            [disabled]="isDownloading.get(version.archivoId)"
                            (click)="descargarVersion(version)">
                      @if (isDownloading.get(version.archivoId)) {
                        <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      }
                      Descargar
                    </button>
                  } @else {
                    <button class="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-gray-300 text-xs font-medium rounded-md transition-colors"
                            (click)="verVersionAntigua(version, historialActivo)">
                      Ver (Solo Lectura)
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class GestionDocumentalListaComponent implements OnChanges {
  @Input({ required: true }) documentos: DocumentoGestionDTO[] = [];
  @Output() verDocumento = new EventEmitter<DocumentoGestionDTO>();
  @Output() recargar = new EventEmitter<void>();

  clientesAgrupados = new Map<string, DocumentoPorCliente>();
  historialActivo: DocumentoGestionDTO | null = null;
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  isDownloading = new Map<string, boolean>();
  uploadProgress = new Map<string, number>();

  formatLocalDateTime(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.length > 10 && !dateStr.endsWith('Z')) {
      return dateStr + 'Z';
    }
    return dateStr;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentos']) {
      console.log('Documentos recibidos en frontend:', this.documentos);
      this.agruparDocumentos();
    }
  }

  agruparDocumentos() {
    this.clientesAgrupados.clear();
    
    for (const doc of this.documentos) {
      const cliId = doc.clienteId || 'sin-cliente';
      const cliNombre = doc.clienteNombre || 'Sin Cliente';
      
      if (!this.clientesAgrupados.has(cliId)) {
        this.clientesAgrupados.set(cliId, {
          clienteNombre: cliNombre,
          tramites: new Map()
        });
      }
      
      const cliente = this.clientesAgrupados.get(cliId)!;
      
      if (!cliente.tramites.has(doc.tramiteId)) {
        cliente.tramites.set(doc.tramiteId, {
          tramiteNombre: doc.tramiteNombre,
          fechaCreacion: doc.fechaCreacion,
          tramiteFechaCreacion: doc.tramiteFechaCreacion,
          documentos: []
        });
      }
      
      cliente.tramites.get(doc.tramiteId)!.documentos.push(doc);
    }
  }

  abrirHistorial(doc: DocumentoGestionDTO) {
    this.historialActivo = doc;
  }
  
  cerrarHistorial() {
    this.historialActivo = null;
  }

  verVersionAntigua(versionMetadata: any, docPrincipal: DocumentoGestionDTO) {
    // Al ver versión antigua, emitimos una copia del DTO pero con los datos de la versión antigua
    // y obligatoriamente editable = false (Doble Candado estricto para históricos)
    const docAntiguo: DocumentoGestionDTO = {
      ...docPrincipal,
      archivoId: versionMetadata.archivoId,
      nombreOriginal: versionMetadata.nombreOriginal,
      rutaS3: versionMetadata.rutaS3,
      extension: versionMetadata.formato || docPrincipal.extension,
      esColaborativo: versionMetadata.esColaborativo,
      editable: false // ¡ESTRICTAMENTE FALSO PARA HISTORIAL!
    };
    
    this.cerrarHistorial();
    this.verDocumento.emit(docAntiguo);
  }

  descargarArchivo(doc: DocumentoGestionDTO) {
    this.isDownloading.set(doc.archivoId, true);
    this.http.get(`${environment.apiUrl}/documentos/${doc.archivoId}/descargar`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nombreOriginal;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading.set(doc.archivoId, false);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        alert('Error al descargar el archivo. Verifica los permisos.');
        this.isDownloading.set(doc.archivoId, false);
      }
    });
  }

  descargarVersion(version: any) {
    this.isDownloading.set(version.archivoId, true);
    this.http.get(`${environment.apiUrl}/documentos/${version.archivoId}/descargar`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = version.nombreOriginal;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading.set(version.archivoId, false);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        alert('Error al descargar el archivo. Verifica los permisos.');
        this.isDownloading.set(version.archivoId, false);
      }
    });
  }

  onStaticFileSelected(event: any, doc: DocumentoGestionDTO) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('campoKey', doc.campoKey || ''); 
    formData.append('pasoId', doc.pasoId || '');

    this.uploadProgress.set(doc.archivoId, 1);
    this.cdr.markForCheck();

    this.http.post(`${environment.apiUrl}/tramites/${doc.tramiteId}/documentos/upload-estatico`, formData, {
      reportProgress: true,
      observe: 'events',
      withCredentials: true
    }).subscribe({
      next: (httpEvent: any) => {
        if (httpEvent.type === 1) { // HttpEventType.UploadProgress
          this.uploadProgress.set(doc.archivoId, Math.round(100 * httpEvent.loaded / (httpEvent.total || file.size)));
          this.cdr.markForCheck();
        } else if (httpEvent.type === 4) { // HttpEventType.Response
          this.uploadProgress.delete(doc.archivoId);
          this.recargar.emit(); 
        }
      },
      error: (err) => {
        console.error('Error uploading replacement', err);
        this.uploadProgress.delete(doc.archivoId);
        this.cdr.markForCheck();
        alert('Error al subir el reemplazo. Verifica tus permisos o el tamaño del archivo.');
      }
    });
  }
}
