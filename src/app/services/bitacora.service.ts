import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Bitacora {
  id: string;
  accion: string;
  usuarioEmail: string;
  usuarioNombre: string;
  rol: string;
  fechaHora: string;
  detalles: string;
}

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/bitacora';

  getBitacora(): Observable<Bitacora[]> {
    return this.http.get<Bitacora[]>(this.apiUrl);
  }
}
