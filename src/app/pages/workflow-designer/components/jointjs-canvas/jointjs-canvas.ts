import { Component, ChangeDetectionStrategy, viewChild, ElementRef, inject, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JointjsEngineService } from '../../services/jointjs-engine.service';
import { WorkflowStateService } from '../../services/workflow-state.service';

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

  constructor() {
    effect(() => {
      const pasos = this.workflowState.pasos();
      const deptos = this.workflowState.departamentos();
      // Si la IA (o simulación) empuja un array de pasos y el motor visual ya cargó, lo ordenamos redibujar
      if (pasos && pasos.length > 0 && this.engineService.isInitialized()) {
        this.engineService.generateFromAiJson(pasos, deptos);
      }
    });
  }

  ngAfterViewInit() {
    // Inicializar el espacio de trabajo SVG inyectando el div nativo al Engine
    this.engineService.initialize(this.paperContainer().nativeElement, (stepId) => {
      // Callback invocado desde fuera de Angular cuando hay doble clic
      this.workflowState.selectPaso(stepId);
      // Forzar que se abra el panel derecho si estaba colapsado
      if (!this.workflowState.isChatExpanded()) {
        this.workflowState.toggleChat();
      }
    });
    
    // Auto dibujado inicial garantizando el carril del Cliente por defecto
    // Auto dibujado inicial garantizando el carril del Cliente por defecto
    const pasos = this.workflowState.pasos() || [];
    const deptos = this.workflowState.departamentos() || [];
    this.engineService.generateFromAiJson(pasos, deptos);
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
      alert("No puedes agregar Inicio y Fin manualmente. Estos se auto-asignan genéricamente en base al estándar de actividades UML.");
      return;
    }

    // Insertar un nuevo paso real a la tienda, permitiendo así su edición posterior
    const copy = [...pasosAnteriores];
    const newOrden = copy.length > 0 ? Math.max(...copy.map(s => s.orden)) + 1 : 1;
    const isActividadType = (type === 'Actividad');
    const newStepName = isActividadType ? `Actividad ${newOrden}` : `Nueva Actividad ${newOrden}`;

    copy.push({
      orden: newOrden,
      departamentoId: targetDeptoId,
      nombrePaso: newStepName,
      formularioJson: {}
    });

    // Subir la mutación, esto disparará el effect() y repintará JointJS
    this.workflowState.setPasos(copy);
  }
}

