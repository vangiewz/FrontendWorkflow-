import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroAuditoria } from '../../../services/auditoria.service';

@Component({
  selector: 'app-auditoria-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative pl-6 border-l border-surface-700/50 space-y-8 animate-fade-in">
      @for (registro of registros; track registro.sk) {
        <div class="relative group">
          <!-- Timeline Dot -->
          <div class="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full border-2 border-surface-900 shadow-sm"
               [ngClass]="getDotClass(registro.tipoEvento)">
          </div>
          
          <!-- Content Card -->
          <div class="bg-surface-800/80 backdrop-blur-md border border-surface-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:bg-surface-700/80 hover:border-surface-600">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div class="flex flex-col">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-semibold text-gray-200">{{ cleanActorName(registro.usuarioActorId) }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-gray-400 border border-surface-600">{{ registro.departamentoActor }}</span>
                </div>
                <span class="text-xs font-mono text-gray-500">{{ formatTimestamp(registro.sk) | date:'medium' }}</span>
              </div>
              
              <div class="shrink-0">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border shadow-sm"
                      [ngClass]="getBadgeClass(registro.tipoEvento)">
                  {{ formatTipoEvento(registro.tipoEvento) }}
                </span>
              </div>
            </div>
            
            <div class="bg-surface-900/50 rounded-lg p-3 border border-surface-700/50">
              <p class="text-sm text-gray-300 leading-relaxed">{{ registro.descripcionDetallada }}</p>
              <div class="flex items-center gap-4 mt-2">
                 <span class="text-[10px] text-gray-500 font-mono">Archivo: {{ (registro.archivoId || 'N/A') | slice:0:8 }}</span>
                 <span class="text-[10px] text-gray-500 font-mono">Trámite: {{ registro.tramiteId || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      }
      
      @if (registros.length === 0) {
        <div class="text-center py-12 bg-surface-800/50 rounded-xl border border-surface-700 border-dashed">
          <svg class="w-12 h-12 text-surface-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-sm font-medium text-gray-400">No hay registros de auditoría</h3>
          <p class="text-xs text-gray-500 mt-1">No se encontraron eventos para este criterio de búsqueda.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AuditoriaTimelineComponent {
  @Input() registros: RegistroAuditoria[] = [];

  cleanActorName(name: string): string {
    if (!name) return 'Desconocido';
    return name.replace(' (Cliente)', '').trim();
  }

  formatTimestamp(sk: string): Date {
    if (!sk) return new Date();
    const isoString = sk.replace('TIMESTAMP#', '');
    return new Date(isoString);
  }

  formatTipoEvento(tipo: string): string {
    if (!tipo) return 'DESCONOCIDO';
    return tipo.replace(/_/g, ' ');
  }

  getDotClass(tipo: string): string {
    if (!tipo) return 'bg-gray-500';
    if (tipo.includes('DELETE') || tipo.includes('ERROR')) {
      return 'bg-rose-500';
    }
    if (tipo === 'UPLOAD_ESTATICO' || tipo === 'REEMPLAZO_ESTATICO' || tipo === 'DOCUMENTO_LEIDO_DESCARGADO') {
      return 'bg-emerald-500';
    }
    if (tipo === 'DOCUMENTO_SUBIDO' || tipo.includes('COLABORATIVO')) {
      return 'bg-purple-500';
    }
    return 'bg-gray-500';
  }

  getBadgeClass(tipo: string): string {
    if (!tipo) return 'bg-surface-700 text-gray-300 border-surface-600';
    if (tipo.includes('DELETE') || tipo.includes('ERROR')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (tipo === 'UPLOAD_ESTATICO' || tipo === 'REEMPLAZO_ESTATICO' || tipo === 'DOCUMENTO_LEIDO_DESCARGADO') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (tipo === 'DOCUMENTO_SUBIDO' || tipo.includes('COLABORATIVO')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    return 'bg-surface-700 text-gray-300 border-surface-600';
  }
}
