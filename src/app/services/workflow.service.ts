import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface WorkflowGeneratedResponse {
  pasos: PasoGenerado[];
}

export interface PasoGenerado {
  orden: number;
  departamentoId: string; // "Cliente" o ID
  nombrePaso: string;
  formularioJson: Record<string, any>;
  isCustom?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  generateWithAi(prompt: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/workflows/ai/generate`,
      { politicaNegocio: prompt },
      { responseType: 'text' }
    );
  }

  saveWorkflow(workflow: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/workflows`, workflow);
  }
}
