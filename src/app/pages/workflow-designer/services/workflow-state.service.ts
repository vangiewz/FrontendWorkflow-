import { Injectable, signal, computed } from '@angular/core';
import { WorkflowEditorState } from '../models/workflow-editor.types';
import { PasoGenerado } from '../../../services/workflow.service';
import { Departamento } from '../../../services/departamento.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowStateService {

  // Single Source of Truth
  private readonly state = signal<WorkflowEditorState>({
    pasos: [],
    departamentos: [],
    isChatExpanded: true,
    scale: 1,
    selectedPasoId: null,
    formularioCliente: {},
    workflowNombre: 'Nuevo Trámite',
    workflowDescripcion: '',
    categoria: 'INTERNO',
    costoBase: 0
  });

  // Selectors
  readonly pasos = computed(() => this.state().pasos);
  readonly departamentos = computed(() => this.state().departamentos);
  readonly isChatExpanded = computed(() => this.state().isChatExpanded);
  readonly scale = computed(() => this.state().scale);
  readonly selectedPasoId = computed(() => this.state().selectedPasoId);
  readonly workflowNombre = computed(() => this.state().workflowNombre);
  readonly workflowDescripcion = computed(() => this.state().workflowDescripcion);
  readonly workflowCategoria = computed(() => this.state().categoria);
  readonly workflowCostoBase = computed(() => this.state().costoBase);
  readonly formularioCliente = computed(() => this.state().formularioCliente);
  
  // Computed helpers
  readonly selectedPaso = computed(() => {
    const sId = this.state().selectedPasoId;
    if (!sId) return null;
    return this.state().pasos.find(p => p.nombrePaso === sId) || null; // Fallback: usamos nombrePaso como ID temporal
  });

  // Updaters (Puros)
  setPasos(pasos: PasoGenerado[]) {
    this.state.update(s => ({ ...s, pasos }));
  }

  setDepartamentos(departamentos: Departamento[]) {
    this.state.update(s => ({ ...s, departamentos }));
  }

  toggleChat() {
    this.state.update(s => ({ ...s, isChatExpanded: !s.isChatExpanded }));
  }

  setScale(scale: number) {
    this.state.update(s => ({ ...s, scale: Math.max(0.2, Math.min(scale, 3)) }));
  }

  selectPaso(id: string | null) {
    this.state.update(s => ({ ...s, selectedPasoId: id }));
  }

  setWorkflowMetadata(nombre: string, descripcion: string, categoria: string = 'INTERNO', costoBase: number = 0) {
    this.state.update(s => ({ ...s, workflowNombre: nombre, workflowDescripcion: descripcion, categoria: categoria, costoBase: costoBase }));
  }

  setFormularioCliente(form: Record<string, any>) {
    this.state.update(s => ({ ...s, formularioCliente: form }));
  }
}
