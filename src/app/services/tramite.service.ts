import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface RegistroTiempo {
  pasoId: string;
  funcionarioId: string | null;
  funcionarioNombre: string | null;
  fechaEntrada: string;
  fechaSalida: string | null;
}

export interface TramiteDTO {
  id: string;
  plantillaId: string;
  nombrePlantilla: string;
  clienteId: string | null;
  estadoGlobal: 'PENDIENTE' | 'EN_PROGRESO' | 'FINALIZADO';
  pasoActualId: string | null;
  datosFormularioCliente: Record<string, any>;
  respuestas: Record<string, Record<string, any>>;
  historialTiempos: RegistroTiempo[];
  fechaCreacion: string;
  fechaFinalizacion: string | null;
}

export interface ResponderPasoRequest {
  pasoId: string;
  respuesta?: Record<string, any>;
  decisionElegida?: string;
}

export interface AsistenteFormularioRequest {
  pasoId: string;
  modo: 'chat' | 'voz';
  mensaje: string;
}

export interface AsistenteFormularioResponse {
  pasoId: string;
  sugerencia: Record<string, unknown>;
  observacion: string;
}

@Injectable({ providedIn: 'root' })
export class TramiteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(): Observable<TramiteDTO[]> {
    return this.http.get<TramiteDTO[]>(`${this.apiUrl}/tramites`);
  }

  getById(id: string): Observable<TramiteDTO> {
    return this.http.get<TramiteDTO>(`${this.apiUrl}/tramites/${id}`);
  }

  iniciarTramite(plantillaId: string, clienteId: string | null, datosCliente: Record<string, any>): Observable<TramiteDTO> {
    return this.http.post<TramiteDTO>(`${this.apiUrl}/tramites`, {
      plantillaId,
      clienteId,
      datosCliente
    });
  }

  responderPaso(tramiteId: string, request: ResponderPasoRequest): Observable<TramiteDTO> {
    return this.http.post<TramiteDTO>(`${this.apiUrl}/tramites/${tramiteId}/responder`, request);
  }

  asistirFormulario(
    tramiteId: string,
    request: AsistenteFormularioRequest
  ): Observable<AsistenteFormularioResponse> {
    return this.http.post<AsistenteFormularioResponse>(
      `${this.apiUrl}/tramites/${tramiteId}/asistir-formulario`,
      request
    );
  }
}
