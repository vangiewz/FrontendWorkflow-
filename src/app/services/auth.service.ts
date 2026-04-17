import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  nombre: string;
  rol: string;
  tipoUsuario: string;
}

/**
 * Servicio de autenticación para usuarios internos (empleados).
 * Se conecta al endpoint POST /api/auth/empleado/login del backend Spring Boot.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Login de empleados (ADMIN / FUNCIONARIO).
   * Llama a POST /api/auth/empleado/login
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/empleado/login`,
      request
    );
  }

  /**
   * Guarda el token JWT en localStorage.
   */
  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Obtiene el token JWT almacenado.
   */
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Guarda los datos del usuario autenticado.
   */
  saveUser(user: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  /**
   * Obtiene los datos del usuario autenticado.
   */
  getUser(): AuthResponse | null {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('auth_user');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  /**
   * Verifica si hay un usuario autenticado.
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Cierra sesión eliminando token y datos del usuario.
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }
}
