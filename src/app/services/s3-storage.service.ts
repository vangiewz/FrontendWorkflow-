import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class S3StorageService {

  private readonly API_URL = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) { }

  descargarDocumento(archivoId: string, rolSolicitante?: string, departamentoSolicitante?: string): Observable<Blob> {
    let headers = new HttpHeaders();
    if (departamentoSolicitante) headers = headers.set('X-Departamento-Solicitante', departamentoSolicitante);
    headers = headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers = headers.set('Pragma', 'no-cache');
    headers = headers.set('Expires', '0');
    
    return this.http.get(`${this.API_URL}/${archivoId}/descargar?t=${new Date().getTime()}`, {
      headers,
      responseType: 'blob'
    });
  }

  finalizarEdicion(archivoId: string, contenidoHTML: string, rolSolicitante?: string, departamentoSolicitante?: string): Observable<any> {
    let headers = new HttpHeaders();
    if (departamentoSolicitante) headers = headers.set('X-Departamento-Solicitante', departamentoSolicitante);

    return this.http.post(`${this.API_URL}/${archivoId}/finalizar-edicion`, { contenido: contenidoHTML }, { headers });
  }
}
