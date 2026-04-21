import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { WorkflowEditorState } from '../models/workflow-editor.types';
import { PasoGenerado, PlantillaWorkflowDTO } from '../../../services/workflow.service';
import { Departamento } from '../../../services/departamento.service';
import { WorkflowWebsocketService } from '../../../services/workflow-websocket.service';
import { AuthService } from '../../../services/auth.service';

const DEFAULT_STATE: WorkflowEditorState = {
  workflowId: null,
  pasos: [],
  departamentos: [],
  isChatExpanded: true,
  scale: 1,
  selectedPasoId: null,
  formularioCliente: {},
  workflowNombre: 'Nuevo Trámite',
  workflowDescripcion: '',
  categoria: 'INTERNO',
  costoBase: 0,
  isDrawArrowMode: false,
  isActive: true
};

@Injectable({
  providedIn: 'root'
})
export class WorkflowStateService {
  private readonly wsService = inject(WorkflowWebsocketService);
  private readonly authService = inject(AuthService);

  // Single Source of Truth
  private readonly state = signal<WorkflowEditorState>({ ...DEFAULT_STATE });

  /**
   * Flag para evitar loops infinitos: cuando recibimos un sync remoto,
   * no queremos re-emitir ese mismo cambio de vuelta.
   */
  private _suppressBroadcast = false;

  // Selectors
  readonly workflowId = computed(() => this.state().workflowId);
  readonly pasos = computed(() => this.state().pasos);
  readonly departamentos = computed(() => this.state().departamentos);
  readonly isChatExpanded = computed(() => this.state().isChatExpanded);
  readonly isDrawArrowMode = computed(() => this.state().isDrawArrowMode);
  readonly scale = computed(() => this.state().scale);
  readonly selectedPasoId = computed(() => this.state().selectedPasoId);
  readonly workflowNombre = computed(() => this.state().workflowNombre);
  readonly workflowDescripcion = computed(() => this.state().workflowDescripcion);
  readonly workflowCategoria = computed(() => this.state().categoria);
  readonly workflowCostoBase = computed(() => this.state().costoBase);
  readonly formularioCliente = computed(() => this.state().formularioCliente);
  readonly isActive = computed(() => this.state().isActive);
  readonly isEditMode = computed(() => this.state().workflowId !== null);
  
  // Computed helpers
  readonly selectedPaso = computed(() => {
    const sId = this.state().selectedPasoId;
    if (!sId) return null;
    return this.state().pasos.find(p => p.id === sId) || null;
  });

  constructor() {
    // Effect reactivo: cada vez que cambia algo relevante del workflow,
    // emitir automáticamente por WebSocket si estamos editando.
    effect(() => {
      const s = this.state();
      // Leer las propiedades que queremos trackear para broadcast
      const _pasos = s.pasos;
      const _nombre = s.workflowNombre;
      const _desc = s.workflowDescripcion;
      const _cat = s.categoria;
      const _costo = s.costoBase;
      const _form = s.formularioCliente;
      const wfId = s.workflowId;

      if (!wfId || this._suppressBroadcast) return;
      
      const user = this.authService.getUser();
      this.wsService.syncFullState(wfId, {
        nombre: _nombre,
        descripcion: _desc,
        categoria: _cat,
        costoBase: _costo,
        formularioCliente: _form,
        pasos: _pasos,
        usuarioNombre: user?.nombre || 'Admin'
      });
    });
  }

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

  toggleDrawArrowMode() {
    this.state.update(s => ({ ...s, isDrawArrowMode: !s.isDrawArrowMode }));
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

  /**
   * Reset completo del editor al estado por defecto (para crear uno nuevo).
   */
  resetToNew() {
    this._suppressBroadcast = true;
    this.state.set({ ...DEFAULT_STATE });
    // Restaurar en el próximo tick
    setTimeout(() => this._suppressBroadcast = false, 0);
  }

  /**
   * Carga un workflow existente desde la BD para editarlo.
   */
  loadFromDTO(dto: PlantillaWorkflowDTO) {
    this._suppressBroadcast = true;
    this.state.update(s => ({
      ...s,
      workflowId: dto.id || null,
      workflowNombre: dto.nombre || 'Sin nombre',
      workflowDescripcion: dto.descripcion || '',
      categoria: dto.categoria || 'INTERNO',
      costoBase: dto.costoBase || 0,
      isActive: dto.isActive ?? true,
      formularioCliente: dto.formularioCliente || {},
      pasos: dto.pasos || [],
      selectedPasoId: null
    }));
    setTimeout(() => this._suppressBroadcast = false, 0);
  }

  /**
   * Aplica un estado remoto recibido por WebSocket (colaboración).
   * No toca los campos de UI local como isChatExpanded ni isDrawArrowMode.
   * Suprime broadcast para evitar loops infinitos.
   */
  applyRemoteSync(sync: any) {
    this._suppressBroadcast = true;
    this.state.update(s => ({
      ...s,
      workflowNombre: sync.nombre ?? s.workflowNombre,
      workflowDescripcion: sync.descripcion ?? s.workflowDescripcion,
      categoria: sync.categoria ?? s.categoria,
      costoBase: sync.costoBase ?? s.costoBase,
      formularioCliente: sync.formularioCliente ?? s.formularioCliente,
      pasos: sync.pasos ?? s.pasos,
      selectedPasoId: null
    }));
    setTimeout(() => this._suppressBroadcast = false, 0);
  }

  /**
   * Genera un snapshot del estado actual para enviar por WebSocket.
   */
  getSnapshot() {
    const s = this.state();
    return {
      nombre: s.workflowNombre,
      descripcion: s.workflowDescripcion,
      categoria: s.categoria,
      costoBase: s.costoBase,
      formularioCliente: s.formularioCliente,
      pasos: s.pasos
    };
  }
}
