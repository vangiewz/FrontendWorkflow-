import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CreateUsuarioRequest {
  email: string;
  password?: string;
  nombre: string;
  rol: string;
  departamentoId?: string;
  telefono?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UsuarioResponse {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  departamentoId: string;
  telefono: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  createUsuario(request: CreateUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.apiUrl, request);
  }

  getUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl);
  }

  updateRol(id: string, rol: string): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.apiUrl}/${id}/rol`, { rol });
  }

  assignDepartamento(id: string, departamentoId: string): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.apiUrl}/${id}/departamento`, { departamentoId });
  }

  adminChangePassword(id: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/admin-password`, { newPassword });
  }

  deleteUsuario(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  reactivateUsuario(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/activar`, {});
  }

  updateTelefono(id: string, telefono: string): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.apiUrl}/${id}/telefono`, { telefono });
  }

  changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/me/password`, request);
  }
}
