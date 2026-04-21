import { PasoGenerado } from '../../../services/workflow.service';
import { Departamento } from '../../../services/departamento.service';

/** Relación de componentes base en un editor visual de Workflows */
export interface WorkflowEditorState {
  workflowId: string | null; // null = creating new, string = editing existing
  pasos: PasoGenerado[];
  departamentos: Departamento[];
  isChatExpanded: boolean;
  scale: number;
  selectedPasoId: string | null;
  formularioCliente: Record<string, any>;
  workflowNombre: string;
  workflowDescripcion: string;
  categoria: string;
  costoBase: number;
  isDrawArrowMode: boolean;
  isActive: boolean;
}
