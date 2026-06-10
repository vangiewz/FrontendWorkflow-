import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface DocumentoGestionDTO {
  archivoId: string;
  nombreOriginal: string;
  rutaS3: string;
  tramiteId: string;
  tramiteNombre: string;
  pasoId: string;
  pasoNombre: string;
  fechaCreacion: string;
  tramiteFechaCreacion: string;
  departamentoGeneradorId: string;
  editable: boolean;
  extension: string;
  esColaborativo: boolean;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  campoKey: string;
  historialVersiones: any[]; // Using any[] or ArchivoMetadata[]
}

@Injectable({
  providedIn: 'root'
})
export class GestionDocumentalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/documentos/gestion`;

  obtenerDocumentos(tipo: 'PENDIENTES' | 'HISTORICO'): Observable<DocumentoGestionDTO[]> {
    return this.http.get<DocumentoGestionDTO[]>(this.apiUrl, {
      params: { tipo }
    });
  }
}
