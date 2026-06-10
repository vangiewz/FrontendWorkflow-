import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegistroAuditoria {
  pk: string;
  sk: string;
  tipoEvento: string;
  usuarioActorId: string;
  departamentoActor: string;
  tramiteId: string;
  archivoId: string;
  descripcionDetallada: string;
}

export interface AuditoriaFilters {
  startDate?: string;
  endDate?: string;
  tipoEvento?: string;
  actorId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auditoria/documental`;

  private buildParams(filters?: AuditoriaFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    if (filters?.tipoEvento) params = params.set('tipoEvento', filters.tipoEvento);
    if (filters?.actorId) params = params.set('actorId', filters.actorId);
    return params;
  }

  obtenerAuditoriaPorCliente(idCliente: string, filters?: AuditoriaFilters): Observable<RegistroAuditoria[]> {
    return this.http.get<RegistroAuditoria[]>(`${this.apiUrl}/${idCliente}`, { params: this.buildParams(filters) });
  }

  obtenerAuditoriaReciente(filters?: AuditoriaFilters): Observable<RegistroAuditoria[]> {
    return this.http.get<RegistroAuditoria[]>(`${this.apiUrl}/recientes`, { params: this.buildParams(filters) });
  }
}
