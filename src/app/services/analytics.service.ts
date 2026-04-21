import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type InsightSeverity = 'CRITICO' | 'ADVERTENCIA' | 'INFO';
export type InsightCause = 'FALTA_PERSONAL' | 'COMPLEJIDAD_FORMULARIO' | 'MIXTO';

export interface EtapaTiempoCompacto {
  pasoId: string;
  funcionarioId: string | null;
  minutosEtapa: number;
}

export interface TramiteTiempoCompacto {
  tramiteId: string;
  tipoTramite: string;
  minutosTotales: number;
  etapas: EtapaTiempoCompacto[];
}

export interface DepartamentoMetrica {
  departamentoId: string;
  departamentoNombre: string;
  promedioHoras: number;
  etapasProcesadas: number;
}

export interface InsightAlerta {
  severidad: InsightSeverity;
  titulo: string;
  descripcion: string;
  departamentoId: string | null;
  funcionarioId: string | null;
  retrasoHoras: number | null;
  causaProbable: InsightCause;
}

export interface PlanAccionItem {
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  accion: string;
  objetivo: string;
  plazoHoras: string;
}

export interface AnalisisCuellosBotellaResponse {
  logsCompactos: TramiteTiempoCompacto[];
  metricasDepartamentos: DepartamentoMetrica[];
  insights: InsightAlerta[];
  planAccion: PlanAccionItem[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCuellosBotella(horasEsperadasPromedio = 24): Observable<AnalisisCuellosBotellaResponse> {
    return this.http.get<AnalisisCuellosBotellaResponse>(
      `${this.apiUrl}/analytics/cuellos-botella`,
      { params: { horasEsperadasPromedio: String(horasEsperadasPromedio) } }
    );
  }
}
