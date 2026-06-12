import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { S3StorageService } from '../../../../services/s3-storage.service';
import { ColaboracionSocketService } from '../../../../services/colaboracion-socket.service';
import { QuillModule } from 'ngx-quill';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
// @ts-ignore
import html2pdf from 'html2pdf.js';

declare var luckysheet: any;

@Component({
  selector: 'app-visor-documento',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './visor-documento.component.html',
  styleUrls: ['./visor-documento.component.css']
})
export class VisorDocumentoComponent implements OnInit, OnDestroy {
  @Input() tramiteId!: string;
  @Input() campoConfig!: any;
  @Input() archivoMetadata!: any;
  @Input() rolUsuario!: string; 
  @Input() departamentoUsuario!: string; 
  @Input() forceReadOnly = false; 

  @ViewChild('luckysheetContainer', { static: false }) luckysheetContainer!: ElementRef;
  @ViewChild('quillEditorRef', { static: false }) quillEditorRef: any;

  tieneAcceso = false;
  puedeEditar = false;
  mensajeRestringido = '';

  esColaborativo = false;
  formato = 'OTRO';
  
  contenidoWord = '';
  isReadOnly = true;
  
  isExportingOriginal = false;
  isExportingPDF = false;
  
  private sessionId = Math.random().toString(36).substring(2, 15);
  private excelDebounceTimer: any;

  constructor(
    private s3Storage: S3StorageService,
    private socketService: ColaboracionSocketService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.evaluarPermisos();
    if (this.tieneAcceso && this.esColaborativo) {
      this.cargarDesdeS3YConectar();
    }
  }

  cargarDesdeS3YConectar() {
    if (this.archivoMetadata?.archivoId) {
      this.s3Storage.descargarDocumento(this.archivoMetadata.archivoId, this.rolUsuario, this.departamentoUsuario)
        .subscribe({
          next: async (blob: Blob) => {
            const texto = await blob.text();
            console.log(`📥 [VISOR S3] Descarga completa. Tamaño: ${blob.size} bytes. Extracto:`, texto.substring(0, 100));
            
            if (this.formato === 'WORD') {
              this.actualizarWordSilenciosamente(texto);
            } else if (this.formato === 'EXCEL') {
              try {
                if (!texto || texto.trim() === '') throw new Error("Texto vacío");
                const sheets = JSON.parse(texto);
                this.initLuckysheet(sheets);
              } catch (e) {
                console.error("❌ Error parseando Excel desde S3 (Posible archivo vacío)", e);
                this.initLuckysheet();
              }
            }
            // Solo después de inyectar los datos, conectarse al WebSocket
            this.iniciarColaboracion();
          },
          error: (err) => {
            console.error('Error HTTP al descargar documento de S3:', err);
            // Ignorar 404 (Not Found) silenciosamente porque es un archivo nuevo
            if (err.status === 404 || err.status === 400) {
              console.warn('Documento no encontrado. Asumiendo que es nuevo.');
              if (this.formato === 'EXCEL') this.initLuckysheet();
              this.iniciarColaboracion();
            } else {
              // 403 Forbidden o 500 Internal Error, bloquear carga.
              this.mensajeRestringido = 'Error de servidor o acceso denegado (HTTP ' + err.status + ')';
              this.tieneAcceso = false;
            }
          }
        });
    } else {
      if (this.formato === 'EXCEL') this.initLuckysheet();
      this.iniciarColaboracion();
    }
  }

  ngOnDestroy() {
    if (this.esColaborativo) {
      this.socketService.desconectar();
    }
  }

  evaluarPermisos() {
    const permisos = this.archivoMetadata?.permisos || this.campoConfig?.permisosPorDefecto || {};
    
    let nivelAcceso = null;
    if (this.rolUsuario === 'ADMIN') {
      nivelAcceso = 'AMBOS';
    } else if (this.rolUsuario === 'CLIENTE') {
      nivelAcceso = permisos['CLIENTE'];
    } else if (this.departamentoUsuario) {
      nivelAcceso = permisos[this.departamentoUsuario];
    }

    if (!nivelAcceso) {
      this.mensajeRestringido = 'Acceso Restringido. No tienes permisos para ver este documento.';
      return;
    }

    this.tieneAcceso = true;
    if (nivelAcceso === 'EDICION' || nivelAcceso === 'AMBOS') {
      this.puedeEditar = true;
    }

    this.isReadOnly = !this.puedeEditar || this.forceReadOnly;

    if (this.isReadOnly && this.forceReadOnly) {
      this.mensajeRestringido = 'Documento abierto en modo Solo Lectura (Bloqueado por Doble Candado).';
    }

    this.esColaborativo = this.archivoMetadata ? this.archivoMetadata.esColaborativo : (this.campoConfig.type === 'DOCUMENTO_COLABORATIVO');
    this.formato = this.archivoMetadata ? (this.archivoMetadata.formato || 'WORD').toUpperCase() : 'WORD';
  }

  iniciarColaboracion() {
    if (!this.archivoMetadata?.archivoId) return;

    this.socketService.conectarYUnirse(this.tramiteId, this.archivoMetadata.archivoId).subscribe(delta => {
       if (this.ngZone) {
         this.ngZone.run(() => {
           if (!delta) return;

           // Al conectar exitosamente, para mostrar "sincronización offline" sobreescribimos a los demás
           if (delta.type === '_INTERNAL_CONNECTED_') {
              console.log('📣 Conexión establecida. Empujando estado local para sobreescribir a la sala (Hack Offline)...');
              
              let currentContent = '';
              if (this.formato === 'WORD') {
                if (this.quillEditorRef && this.quillEditorRef.quillEditor) {
                  currentContent = this.quillEditorRef.quillEditor.root.innerHTML;
                } else {
                  currentContent = this.contenidoWord;
                }
                if (currentContent && currentContent.trim() !== '') {
                  this.socketService.enviarDelta(this.tramiteId, this.archivoMetadata.archivoId, {
                    type: 'DELTA',
                    sender: this.sessionId,
                    content: currentContent
                  });
                }
              } else if (this.formato === 'EXCEL' && typeof luckysheet !== 'undefined') {
                currentContent = JSON.stringify(luckysheet.getAllSheets());
                if (currentContent && currentContent !== '[]') {
                  this.socketService.enviarDelta(this.tramiteId, this.archivoMetadata.archivoId, {
                    type: 'EXCEL_DELTA',
                    sender: this.sessionId,
                    content: currentContent
                  });
                }
              }
              return;
           }

           // Prevención de Bucles: Ignorar mis propios mensajes
           if (delta.sender === this.sessionId) return;

           if (delta.type === 'REQUEST_STATE') {
             console.log('👀 Petición REQUEST_STATE recibida de:', delta.sender);
             let currentContent = '';
             if (this.formato === 'WORD') {
               if (this.quillEditorRef && this.quillEditorRef.quillEditor) {
                 currentContent = this.quillEditorRef.quillEditor.root.innerHTML;
               } else {
                 currentContent = this.contenidoWord;
               }
             } else if (this.formato === 'EXCEL' && typeof luckysheet !== 'undefined') {
               currentContent = JSON.stringify(luckysheet.getAllSheets());
             }

             if (currentContent) {
               console.log('🎯 Respondiendo con FULL_STATE a:', delta.sender);
               this.socketService.enviarDelta(this.tramiteId, this.archivoMetadata.archivoId, {
                 type: 'FULL_STATE',
                 target: delta.sender,
                 sender: this.sessionId,
                 content: currentContent,
                 formato: this.formato
               });
             }
             return;
           }

           if (delta.type === 'FULL_STATE' && delta.target === this.sessionId) {
             console.log('🎁 Recibido FULL_STATE inicial de:', delta.sender);
             if (this.formato === 'WORD' && delta.formato === 'WORD') {
               this.actualizarWordSilenciosamente(delta.content);
             } else if (this.formato === 'EXCEL' && delta.formato === 'EXCEL') {
               this.recrearExcel(delta.content);
             }
             return;
           }

           // Flujo normal de edición en tiempo real
           if (this.formato === 'WORD' && (!delta.type || delta.type === 'DELTA')) {
             this.actualizarWordSilenciosamente(delta.content);
           } else if (this.formato === 'EXCEL' && delta.type === 'EXCEL_DELTA') {
             this.recrearExcel(delta.content);
           }
         });
       }
    });
  }

  private actualizarWordSilenciosamente(htmlContent: string | any) {
    if (typeof htmlContent !== 'string') {
      console.warn('⚠️ Se ignoró una actualización de Word porque el contenido no es un string HTML válido:', htmlContent);
      return;
    }
    
    this.contenidoWord = htmlContent;
    if (this.quillEditorRef && this.quillEditorRef.quillEditor) {
      const quill = this.quillEditorRef.quillEditor;
      const selection = quill.getSelection();
      const converted = quill.clipboard.convert(htmlContent);
      quill.setContents(converted, 'silent');
      if (selection) {
        quill.setSelection(selection.index, selection.length, 'silent');
      }
    }
    this.cdr?.detectChanges();
  }

  private recrearExcel(jsonContent: string) {
    if (typeof luckysheet === 'undefined') return;
    try {
      const sheets = JSON.parse(jsonContent);
      console.log('🔄 Recreando Excel con nuevos datos...');
      this.initLuckysheet(sheets);
    } catch (e) {
      console.error("❌ Error al recrear Excel desde WebSocket", e);
    }
  }

  onWordChange(event: any) {
    if (!this.puedeEditar) return;
    if (event.source === 'user') {
      this.socketService.enviarDelta(this.tramiteId, this.archivoMetadata.archivoId, {
        type: 'DELTA',
        sender: this.sessionId,
        content: event.html
      });
    }
  }

  getNombreSanitizado(extension: string): string {
    let baseName = this.archivoMetadata?.nombreOriginal || this.campoConfig?.description || 'Documento';
    baseName = baseName.replace(/\.[^/.]+$/, ""); // Quitar extensión previa
    baseName = baseName.replace(/[^a-zA-Z0-9_\-\s]/g, '_'); // Sanitizar
    return `${baseName}.${extension}`;
  }

  descargarS3Original() {
    if (!this.archivoMetadata?.archivoId) return;
    this.isExportingOriginal = true;
    this.s3Storage.descargarDocumento(this.archivoMetadata.archivoId, this.rolUsuario, this.departamentoUsuario).subscribe({
      next: (blob) => {
        let ext = 'bin';
        if (this.formato === 'WORD') ext = 'doc';
        else if (this.formato === 'EXCEL') ext = 'xlsx';
        else if (blob.type.includes('pdf')) ext = 'pdf';
        else if (blob.type.includes('image/png')) ext = 'png';
        else if (blob.type.includes('image/jpeg')) ext = 'jpg';
        
        saveAs(blob, this.getNombreSanitizado(ext));
        this.isExportingOriginal = false;
      },
      error: () => {
        this.isExportingOriginal = false;
        alert('Error al descargar el archivo desde S3.');
      }
    });
  }

  async descargarOriginal() {
    this.isExportingOriginal = true;
    try {
      if (this.formato === 'WORD') {
        const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body>${this.contenidoWord}</body></html>`;
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        saveAs(blob, this.getNombreSanitizado('doc'));
      } else if (this.formato === 'EXCEL') {
        const sheets = luckysheet.getAllSheets();
        const workbook = new ExcelJS.Workbook();
        
        sheets.forEach((sheet: any) => {
          const ws = workbook.addWorksheet(sheet.name || 'Hoja');
          if (sheet.data) {
            sheet.data.forEach((row: any, r: number) => {
              if (row) {
                row.forEach((cell: any, c: number) => {
                  if (cell && (cell.m !== undefined || cell.v !== undefined)) {
                     const wsCell = ws.getCell(r + 1, c + 1);
                     wsCell.value = cell.m !== undefined ? cell.m : cell.v;
                  }
                });
              }
            });
          }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, this.getNombreSanitizado('xlsx'));
      }
    } catch (e) {
      console.error('Error exportando original:', e);
      alert('Error al generar el archivo original.');
    } finally {
      this.isExportingOriginal = false;
    }
  }

  async descargarPDF() {
    this.isExportingPDF = true;
    try {
      if (this.formato === 'WORD') {
        const element = document.createElement('div');
        element.innerHTML = this.contenidoWord;
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        
        await html2pdf().from(element).set({
          margin: 10,
          filename: this.getNombreSanitizado('pdf'),
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
      } else if (this.formato === 'EXCEL') {
        const sheets = luckysheet.getAllSheets();
        const activeSheet = sheets.find((s: any) => s.status === 1) || sheets[0];
        
        let html = '<div style="font-family: Arial, sans-serif; padding: 20px;">';
        html += `<h2 style="text-align: center; color: #333;">${activeSheet.name || 'Tabla de Datos'}</h2>`;
        html += '<table style="border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 15px;">';
        
        if (activeSheet && activeSheet.data) {
           activeSheet.data.forEach((row: any) => {
             html += '<tr>';
             if (row) {
               row.forEach((cell: any) => {
                 const val = (cell && (cell.m !== undefined || cell.v !== undefined)) ? (cell.m !== undefined ? cell.m : cell.v) : '';
                 html += `<td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #1e293b;">${val}</td>`;
               });
             }
             html += '</tr>';
           });
        }
        html += '</table></div>';
        
        const element = document.createElement('div');
        element.innerHTML = html;
        
        await html2pdf().from(element).set({
          margin: 10,
          filename: this.getNombreSanitizado('pdf'),
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).save();
      }
    } catch (e) {
      console.error('Error exportando PDF:', e);
      alert('Error al generar el archivo PDF.');
    } finally {
      this.isExportingPDF = false;
    }
  }

  subirNuevaVersion(event: any) {
    alert("Nueva versión en progreso (Simulación desde input file)");
  }

  finalizarEdicion(): import('rxjs').Observable<any> | null {
    if (!this.archivoMetadata?.archivoId) return null;
    
    let contenidoFinal = '';
    if (this.formato === 'WORD') {
      contenidoFinal = this.contenidoWord;
    } else if (this.formato === 'EXCEL') {
      contenidoFinal = JSON.stringify(luckysheet.getAllSheets());
    }

    return this.s3Storage.finalizarEdicion(this.archivoMetadata.archivoId, contenidoFinal, this.rolUsuario, this.departamentoUsuario);
  }

  private getLuckysheetHooks() {
    return {
      updated: (operate: any) => {
        if (!this.puedeEditar) return;
        
        console.log('⚡ Luckysheet event [updated] disparado:', operate);
        // Debounce de 800ms para proteger la UX
        clearTimeout(this.excelDebounceTimer);
        this.excelDebounceTimer = setTimeout(() => {
          const sheetsData = luckysheet.getAllSheets();
          console.log('📦 Empaquetando y enviando Excel...', sheetsData);
          this.socketService.enviarDelta(this.tramiteId, this.archivoMetadata.archivoId, {
            type: 'EXCEL_DELTA',
            sender: this.sessionId,
            content: JSON.stringify(sheetsData)
          });
        }, 800);
      }
    };
  }

  initLuckysheet(data?: any) {
    if (typeof luckysheet !== 'undefined') {
      const config: any = {
        container: 'luckysheet-container',
        lang: 'es',
        allowEdit: this.puedeEditar,
        hook: this.getLuckysheetHooks()
      };
      
      if (data) {
        config.data = data;
      }
      
      console.log('⚙️ Inicializando/Recreando Luckysheet con config:', config);
      try {
        luckysheet.create(config);
      } catch (e) {
        console.error('❌ Error fatal al crear Luckysheet:', e);
      }
    }
  }
}
