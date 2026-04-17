import { Injectable, NgZone, inject } from '@angular/core';
import * as joint from 'jointjs';

export interface Point { x: number; y: number; }

@Injectable({
  providedIn: 'root'
})
export class JointjsEngineService {
  private zone = inject(NgZone);

  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;

  // Control de Panning
  private dragStartPosition: Point | null = null;
  // Eventos y callbacks son inyectados desde la capa de UI


  initialize(containerElement: HTMLElement, onNodeSelected: (id: string) => void) {
    this.zone.runOutsideAngular(() => {
      this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

      this.paper = new joint.dia.Paper({
        el: containerElement,
        model: this.graph,
        width: '100%',
        height: '100%',
        gridSize: 10,
        drawGrid: { name: 'dot', args: { color: '#334155', thickness: 1 } },
        background: { color: '#0F172A' },
        cellViewNamespace: joint.shapes,
        defaultRouter: { name: 'manhattan' },
        defaultConnector: { name: 'rounded' },
        clickThreshold: 10
      });

      this.setupPanningAndZoom();
      
      // Manejador de doble clic para UML
      this.paper.on('element:pointerdblclick', (elementView: any) => {
        const stepId = elementView.model.prop('custom/stepId');
        if (stepId) {
          this.zone.run(() => onNodeSelected(stepId));
        }
      });
    });
  }

  // Panning y zoom omitido en este replace por brevedad (lo mantengo igual, solo recorté el view)

  private setupPanningAndZoom() {
    this.paper.on('blank:pointerdown', (evt: any, x: number, y: number) => {
      this.dragStartPosition = { x: evt.clientX, y: evt.clientY };
    });
    this.paper.on('blank:pointermove', (evt: any, x: number, y: number) => {
      if (this.dragStartPosition) {
        const translate = this.paper.translate();
        const dx = evt.clientX - this.dragStartPosition.x;
        const dy = evt.clientY - this.dragStartPosition.y;
        this.paper.translate(translate.tx + dx, translate.ty + dy);
        this.dragStartPosition = { x: evt.clientX, y: evt.clientY };
      }
    });
    this.paper.on('blank:pointerup', () => this.dragStartPosition = null);

    const paperEl = this.paper.el;
    paperEl.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const currentScale = this.paper.scale().sx;
      let newScale = currentScale + ((e.deltaY > 0 ? -1 : 1) * 0.1);
      newScale = Math.max(0.2, Math.min(newScale, 3));
      const rect = paperEl.getBoundingClientRect();
      const tx = (e.clientX - rect.left);
      const ty = (e.clientY - rect.top);
      const localPoint = this.paper.clientToLocalPoint({ x: e.clientX, y: e.clientY });
      this.paper.scale(newScale, newScale);
      this.paper.translate(tx - (localPoint.x * newScale), ty - (localPoint.y * newScale));
    }, { passive: false });
  }

  public getGraph() { return this.graph; }
  public getPaper() { return this.paper; }
  public isInitialized() { return !!this.paper; }

  public generateFromAiJson(pasos: any[], deptosReales: { id: string, nombre: string }[] = []) {
    this.zone.runOutsideAngular(() => {
      this.graph.clear();
      
      // Columnas UML
      const LANE_WIDTH = 300;
      const VERTICAL_SPACING = 150;
      const LANE_HEIGHT = Math.max(800, (pasos.length + 4) * VERTICAL_SPACING + 200);
      
      // GARANTIZA que 'Cliente' es siempre el índice 0 y siempre existe
      const deptoIds = Array.from(new Set(['Cliente', ...pasos.map(p => p.departamentoId || 'Desconocido')]));
      const laneMap = new Map<string, joint.shapes.standard.Rectangle>();
      
      // Dibujar Carriles Transparentes Verticales
      deptoIds.forEach((deptoId, index) => {
        let humanName = deptoId;
        if (deptoId !== 'Cliente') {
           const foundDepto = deptosReales.find(d => d.id === deptoId);
           if (foundDepto) humanName = foundDepto.nombre;
        }

        const lane = new joint.shapes.standard.Rectangle();
        lane.position(50 + (index * LANE_WIDTH), 50);
        lane.resize(LANE_WIDTH, LANE_HEIGHT);
        lane.attr({
          body: { fill: 'transparent', stroke: '#475569', strokeWidth: 2 },
          label: { text: humanName, fill: '#F8FAFC', refY: 20, textAnchor: 'middle', fontWeight: 'bold' }
        });
        lane.addTo(this.graph);
        lane.toBack();
        laneMap.set(deptoId, lane);
      });

      const nodeMap = new Map<number, joint.shapes.standard.Rectangle>();
      const nodePositions = new Map<string, number>(); 
      
      pasos.sort((a,b) => a.orden - b.orden);

      // Círculo de Inicio UML en la primera columna ('Cliente')
      const startNode = new joint.shapes.standard.Circle();
      startNode.position(50 + (LANE_WIDTH / 2) - 20, 100);
      startNode.resize(40, 40);
      startNode.attr({ body: { fill: '#F8FAFC', stroke: '#10B981', strokeWidth: 3 }});
      startNode.addTo(this.graph);

      // Nodo Estático: Inicio de Proceso (El formulario del cliente)
      const inicioProcesoNode = new joint.shapes.standard.Rectangle();
      inicioProcesoNode.position(50 + (LANE_WIDTH / 2) - 80, 100 + VERTICAL_SPACING);
      inicioProcesoNode.resize(160, 60);
      inicioProcesoNode.prop('custom/stepId', 'Inicio de proceso');
      inicioProcesoNode.attr({
        body: { fill: '#1E293B', stroke: '#10B981', strokeWidth: 2, rx: 8, ry: 8 },
        label: { text: 'Inicio de proceso', fill: '#10B981', fontSize: 12, fontWeight: 'bold' }
      });
      inicioProcesoNode.addTo(this.graph);
      let clienteLane = laneMap.get('Cliente');
      if (clienteLane) clienteLane.embed(inicioProcesoNode);

      nodePositions.set('Cliente', 2); // Ocupamos Y=1 para Inicio Proceso

      // Actividades (Y comienza a calcularse usando nodePositions que arranca en 2 para Cliente o 1 para los demas)
      pasos.forEach((paso, i) => {
        const depto = paso.departamentoId || 'Cliente';
        const lane = laneMap.get(depto);
        const laneIndex = deptoIds.indexOf(depto);
        
        let yOffset = nodePositions.get(depto) || 1;
        
        const x = 50 + (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2) - 80; // Centrado en carril
        const y = 100 + (yOffset * VERTICAL_SPACING); // Abajo
        
        const rect = new joint.shapes.standard.Rectangle();
        rect.position(x, y);
        rect.resize(160, 60);
        rect.prop('custom/stepId', paso.nombrePaso); 
        rect.attr({
          body: { fill: '#1E293B', stroke: '#8B5CF6', strokeWidth: 2, rx: 8, ry: 8 },
          label: {
            text: paso.nombrePaso.length > 25 ? paso.nombrePaso.substring(0,25) + '...' : paso.nombrePaso,
            fill: '#F8FAFC',
            fontSize: 12
          }
        });
        rect.addTo(this.graph);
        
        if (lane) lane.embed(rect);
        nodeMap.set(paso.orden, rect);
        nodePositions.set(depto, yOffset + 1);
      });

      // Nodo Estático: Notificación recibida (Siempre al final del Cliente)
      let maxYOffset = 1;
      nodePositions.forEach((v) => { if (v > maxYOffset) maxYOffset = v; });
      let notificacionY = 100 + (maxYOffset * VERTICAL_SPACING);

      const notificacionNode = new joint.shapes.standard.Rectangle();
      notificacionNode.position(50 + (LANE_WIDTH / 2) - 80, notificacionY);
      notificacionNode.resize(160, 60);
      notificacionNode.prop('custom/stepId', 'Notificación recibida');
      notificacionNode.attr({
        body: { fill: '#1E293B', stroke: '#EF4444', strokeWidth: 2, rx: 8, ry: 8 },
        label: { text: 'Notificación recibida', fill: '#EF4444', fontSize: 12, fontWeight: 'bold' }
      });
      notificacionNode.addTo(this.graph);
      if (clienteLane) clienteLane.embed(notificacionNode);

      // Círculo de Fin UML
      const endNode = new joint.shapes.standard.Circle();
      endNode.position(50 + (LANE_WIDTH / 2) - 20, notificacionY + VERTICAL_SPACING);
      endNode.resize(40, 40);
      endNode.attr({ body: { fill: '#F8FAFC', stroke: '#EF4444', strokeWidth: 4 }}); // bullseye rojo
      endNode.addTo(this.graph);

      const linkFactory = (s: any, t: any) => {
        const link = new joint.shapes.standard.Link();
        link.source(s).target(t).router('manhattan').connector('rounded');
        link.attr({ line: { stroke: '#64748B', strokeWidth: 2, targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z', fill: '#64748B' } }});
        link.addTo(this.graph);
      };

      // Secuencia: Start -> InicioProceso -> [Pasos] -> Notificacion -> End
      linkFactory(startNode, inicioProcesoNode);
      if (pasos.length === 0) {
        linkFactory(inicioProcesoNode, notificacionNode);
      } else {
        linkFactory(inicioProcesoNode, nodeMap.get(pasos[0].orden));
        for (let i = 0; i < pasos.length - 1; i++) {
          linkFactory(nodeMap.get(pasos[i].orden), nodeMap.get(pasos[i+1].orden));
        }
        linkFactory(nodeMap.get(pasos[pasos.length - 1].orden), notificacionNode);
      }
      linkFactory(notificacionNode, endNode);

      setTimeout(() => this.paper.scaleContentToFit({ padding: 50, minScale: 0.2, maxScale: 1 }), 50);
    });
  }
      

  
  // Agregar un nodo básico al canvas para probar drag and drop desde la paleta
  public addTestNode(x: number, y: number, text: string) {
    this.zone.runOutsideAngular(() => {
      const rect = new joint.shapes.standard.Rectangle();
      rect.position(x, y);
      rect.resize(120, 50);
      rect.attr({
        body: {
          fill: '#1E293B', // tailwind surface-800
          stroke: '#8B5CF6', // purple-500
          strokeWidth: 2,
          rx: 8,
          ry: 8
        },
        label: {
          text: text,
          fill: '#F8FAFC',
          fontSize: 12,
          fontFamily: 'sans-serif'
        }
      });
      rect.addTo(this.graph);
    });
  }
}
