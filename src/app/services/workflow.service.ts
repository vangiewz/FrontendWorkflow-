import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface WorkflowGeneratedResponse {
  pasos: PasoGenerado[];
}

export interface PasoGenerado {
  id: string;
  tipo: 'ACTIVIDAD' | 'DECISION';
  departamentoId: string | null;
  nombrePaso: string;
  formularioJson: Record<string, any> | null;
  siguientes: Record<string, string>;
  isCustom?: boolean;
}

export interface PlantillaWorkflowDTO {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  costoBase: number;
  isActive: boolean;
  formularioCliente: Record<string, any>;
  pasos: PasoGenerado[];
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

  saveWorkflow(workflow: any): Observable<PlantillaWorkflowDTO> {
    return this.http.post<PlantillaWorkflowDTO>(`${this.apiUrl}/workflows`, workflow);
  }

  getAllWorkflows(): Observable<PlantillaWorkflowDTO[]> {
    return this.http.get<PlantillaWorkflowDTO[]>(`${this.apiUrl}/workflows`);
  }

  getWorkflowById(id: string): Observable<PlantillaWorkflowDTO> {
    return this.http.get<PlantillaWorkflowDTO>(`${this.apiUrl}/workflows/${id}`);
  }

  updateWorkflow(id: string, workflow: any): Observable<PlantillaWorkflowDTO> {
    return this.http.put<PlantillaWorkflowDTO>(`${this.apiUrl}/workflows/${id}`, workflow);
  }

  toggleActive(id: string): Observable<PlantillaWorkflowDTO> {
    return this.http.patch<PlantillaWorkflowDTO>(`${this.apiUrl}/workflows/${id}/toggle-active`, {});
  }
}
