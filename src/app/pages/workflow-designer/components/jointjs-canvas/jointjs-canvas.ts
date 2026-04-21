import { Component, ChangeDetectionStrategy, viewChild, ElementRef, inject, AfterViewInit, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JointjsEngineService } from '../../services/jointjs-engine.service';
import { WorkflowStateService } from '../../services/workflow-state.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { DialogService } from '../../../../shared/dialog/dialog.service';

@Component({
  selector: 'app-jointjs-canvas',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="w-full h-full relative overflow-hidden bg-surface-950" 
      #paperContainer
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event)"
    >
      <!-- JointJS will inject SVG here -->
    </div>
  `
})
export class JointjsCanvasComponent implements AfterViewInit {
  paperContainer = viewChild.required<ElementRef>('paperContainer');
  private engineService = inject(JointjsEngineService);
  private workflowState = inject(WorkflowStateService);
  private toast = inject(ToastService);
  private dialogService = inject(DialogService);

  constructor() {
    effect(() => {
      const pasos = this.workflowState.pasos();
      const deptos = this.workflowState.departamentos();
      const isArrow = untracked(() => this.workflowState.isDrawArrowMode());
      // Si la IA o el usuario mutan el array de pasos, redibujamos el lienzo
      if (pasos && this.engineService.isInitialized()) {
        this.engineService.generateFromAiJson(pasos, deptos, isArrow);
      }
    });
    
    // Sincronizar el toggle visual
    effect(() => {
      const isArrow = this.workflowState.isDrawArrowMode();
      if (this.engineService.isInitialized()) {
        this.engineService.setLinkMode(isArrow);
      }
    });
  }

  ngAfterViewInit() {
    // Inicializar el espacio de trabajo SVG
    this.engineService.initialize(this.paperContainer().nativeElement, (stepId) => {
      this.workflowState.selectPaso(stepId);
      if (!this.workflowState.isChatExpanded()) {
        this.workflowState.toggleChat();
      }
    }, (sourceId, targetId) => {
      if (sourceId === targetId) return;
      const pasos = [...this.workflowState.pasos()];
      const sourceIndex = pasos.findIndex(p => p.id === sourceId);
      
      if (sourceIndex >= 0) {
         const p = pasos[sourceIndex];
         if (p.tipo === 'DECISION') {
             this.dialogService.prompt(
               'Condición de Conexión', 
               'Ingrese la condición para este camino (ej: Aprobado, Rechazado):'
             ).subscribe(condition => {
                 if (!condition) {
                     this.workflowState.setPasos([...this.workflowState.pasos()]); // repintar para borrar flecha suelta
                     return;
                 }
                 this.enlazar(pasos, sourceIndex, targetId, condition);
             });
         } else {
             // Es Actividad linear
             this.enlazar(pasos, sourceIndex, targetId, 'default');
         }
      }
    }, (sourceId, targetId) => {
      // Borrar enlace
      const pasos = [...this.workflowState.pasos()];
      const sourceIndex = pasos.findIndex(p => p.id === sourceId);
      if (sourceIndex >= 0) {
         const p = pasos[sourceIndex];
         const s = { ...p.siguientes };
         const keyToRemove = Object.keys(s).find(k => s[k] === targetId);
         if (keyToRemove) {
             delete s[keyToRemove];
             pasos[sourceIndex] = { ...p, siguientes: s };
             this.workflowState.setPasos(pasos);
         }
      }
    });
    
    // Auto dibujado inicial garantizando el carril del Cliente por defecto
    const pasos = this.workflowState.pasos() || [];
    const deptos = this.workflowState.departamentos() || [];
    this.engineService.generateFromAiJson(pasos, deptos, this.workflowState.isDrawArrowMode());
  }

  private enlazar(pasos: any[], sourceIndex: number, targetId: string, label: string) {
      const p = pasos[sourceIndex];
      const s = { ...p.siguientes };
      s[label] = targetId;
      pasos[sourceIndex] = { ...p, siguientes: s };
      this.workflowState.setPasos(pasos);
  }

  // Soporte básico de D&D desde la paleta izquierda hacia el canvas global
  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necesario para permitir Drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('text/plain');
    if (!type) return;

    // Convertir coordenadas de drop en locales al SVG
    const paper = this.engineService.getPaper();
    const localPoint = paper.clientToLocalPoint({ x: event.clientX, y: event.clientY });

    // Determinar a qué carril cayó (Cada carril mide 300 de ancho, empiezan en X=50)
    const laneIndex = Math.max(0, Math.floor((localPoint.x - 50) / 300));
    
    // Extraer qué carriles están vivos actualmente, respetando que el indice 0 siempre es Cliente
    const pasosAnteriores = this.workflowState.pasos() || [];
    const carrilesVivos = Array.from(new Set(['Cliente', ...pasosAnteriores.map(p => p.departamentoId || 'Cliente')]));
    
    let targetDeptoId = carrilesVivos[laneIndex];
    if (!targetDeptoId) {
      // Si cayó fuera del rango existente, y el payload no es una actividad (ej. es un ID tirado de la paleta), arranca ese carril.
      targetDeptoId = (type !== 'Actividad' && type !== 'Notificación' && type !== 'Inicio' && type !== 'Fin') ? type : 'Cliente';
    }

    // Ignoramos Inicio o Fin porque ya hay nodos nativos UML auto-inyectados
    if (type === 'Inicio' || type === 'Fin') {
      this.toast.error("No puedes agregar Inicio y Fin manualmente. Estos se auto-asignan.");
      return;
    }

    // Insertar un nuevo paso real a la tienda, permitiendo así su edición posterior
    const copy = [...pasosAnteriores];
    const newId = `paso_${Date.now()}`;
    const isDecision = (type === 'Decisión');
    const newStepName = isDecision ? `Decisión` : `Nueva Actividad`;

    copy.push({
      id: newId,
      tipo: isDecision ? 'DECISION' : 'ACTIVIDAD',
      departamentoId: targetDeptoId === 'Cliente' ? null : targetDeptoId,
      nombrePaso: newStepName,
      formularioJson: isDecision ? null : {},
      siguientes: {}
    });

    // Subir la mutación, esto disparará el effect() y repintará JointJS
    this.workflowState.setPasos(copy);
  }
}

