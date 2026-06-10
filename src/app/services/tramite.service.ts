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
  clienteEmail?: string | null;
  estadoGlobal: 'PENDIENTE' | 'EN_PROGRESO' | 'FINALIZADO' | 'ESPERANDO_PAGO';
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA' | string;
  riesgoDemora?: boolean;
  esAnomalo?: boolean;
  pasosActualesIds: string[];
  datosFormularioCliente: Record<string, any>;
  respuestas: Record<string, Record<string, any>>;
  historialTiempos: RegistroTiempo[];
  fechaCreacion: string;
  fechaFinalizacion: string | null;
  paymentId?: string | null;
  invoiceUrl?: string | null;
  documentos?: any[];
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
    let hasFiles = false;
    const formData = new FormData();
    const datosClienteCopy = { ...datosCliente };

    for (const key of Object.keys(datosClienteCopy)) {
      if (datosClienteCopy[key] instanceof File) {
        hasFiles = true;
        formData.append(key, datosClienteCopy[key] as File);
        delete datosClienteCopy[key];
      }
    }

    const payload = {
      plantillaId,
      clienteId,
      datosCliente: datosClienteCopy
    };

    if (hasFiles) {
      formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      return this.http.post<TramiteDTO>(`${this.apiUrl}/tramites`, formData);
    }

    return this.http.post<TramiteDTO>(`${this.apiUrl}/tramites`, payload);
  }

  responderPaso(tramiteId: string, request: ResponderPasoRequest): Observable<TramiteDTO> {
    const formData = new FormData();
    const requestJsonData = { ...request };
    
    if (requestJsonData.respuesta) {
      requestJsonData.respuesta = { ...request.respuesta };
      for (const key of Object.keys(requestJsonData.respuesta)) {
        if (requestJsonData.respuesta[key] instanceof File) {
          formData.append(key, requestJsonData.respuesta[key] as File);
          delete requestJsonData.respuesta[key];
        }
      }
    }

    formData.append('datos', new Blob([JSON.stringify(requestJsonData)], { type: 'application/json' }));

    return this.http.post<TramiteDTO>(`${this.apiUrl}/tramites/${tramiteId}/responder`, formData);
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

  inicializarDocumento(tramiteId: string, campoKey: string, formato: string, permisos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tramites/${tramiteId}/documentos/inicializar`, {
      campoKey,
      formato,
      permisos
    });
  }
}
