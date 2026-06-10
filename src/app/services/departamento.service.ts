import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Departamento {
  id: string;
  nombre: string;
  isActive: boolean;
}

export interface CreateDepartamentoRequest {
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class DepartamentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Obtiene la lista de todos los departamentos
   */
  getDepartamentos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.apiUrl}/departamentos`);
  }

  /**
   * Crea un nuevo departamento (Requiere rol ADMIN)
   */
  createDepartamento(request: CreateDepartamentoRequest): Observable<Departamento> {
    return this.http.post<Departamento>(`${this.apiUrl}/departamentos`, request);
  }

  updateDepartamento(id: string, request: { nombre: string }): Observable<Departamento> {
    return this.http.patch<Departamento>(`${this.apiUrl}/departamentos/${id}`, request);
  }

  toggleActive(id: string): Observable<Departamento> {
    return this.http.patch<Departamento>(`${this.apiUrl}/departamentos/${id}/toggle-active`, {});
  }

  deleteDepartamento(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/departamentos/${id}`);
  }
}
