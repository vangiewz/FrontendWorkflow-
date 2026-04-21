import { Injectable, NgZone, inject } from '@angular/core';
import * as joint from 'jointjs';
import * as dagre from 'dagre';
import { PasoGenerado } from '../../../services/workflow.service';

export interface Point { x: number; y: number; }

@Injectable({
  providedIn: 'root'
})
export class JointjsEngineService {
  private zone = inject(NgZone);

  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;

  private dragStartPosition: Point | null = null;
  private arrowMode = false;


  initialize(
    containerElement: HTMLElement, 
    onNodeSelected: (id: string) => void, 
    onLinkCreated: (source: string, target: string) => void,
    onLinkDeleted: (source: string, target: string) => void
  ) {
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
        clickThreshold: 10,
        linkPinning: false,
        validateMagnet: (cellView, magnet) => {
            return this.arrowMode;
        },
        validateConnection: (cellViewS, magnetS, cellViewT, magnetT, end, linkView) => {
            if (cellViewS === cellViewT) return false;
            return !!magnetT && cellViewT.model.isElement();
        },
        defaultLink: new joint.shapes.standard.Link({
            attrs: {
                line: { stroke: '#64748B', strokeWidth: 2, targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z', fill: '#64748B' } }
            }
        })
      });

      this.setupPanningAndZoom();
      
      this.paper.on('element:pointerdblclick', (elementView: any) => {
        const stepId = elementView.model.prop('custom/stepId');
        if (stepId) {
          this.zone.run(() => onNodeSelected(stepId));
        }
      });
      
      this.paper.on('link:connect', (linkView: any) => {
        const s = linkView.sourceView?.model.prop('custom/stepId');
        const t = linkView.targetView?.model.prop('custom/stepId');
        if (s && t) {
          this.zone.run(() => onLinkCreated(s, t));
        }
      });
      
      this.paper.on('link:pointerdblclick', (linkView: any) => {
        const s = linkView.sourceView?.model.prop('custom/stepId');
        const t = linkView.targetView?.model.prop('custom/stepId');
        if (s && t) {
          this.zone.run(() => onLinkDeleted(s, t));
        }
      });
    });
  }

  setLinkMode(enabled: boolean) {
    this.arrowMode = enabled;
  }

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

  public generateFromAiJson(pasos: PasoGenerado[], deptosReales: { id: string, nombre: string }[] = [], isArrowMode: boolean = false) {
    this.zone.runOutsideAngular(() => {
      this.graph.clear();
      
      const LANE_WIDTH = 300;
      const VERTICAL_SPACING = 150;
      
      const deptoIds = Array.from(new Set(['Cliente', ...pasos.map(p => p.departamentoId || 'Cliente')]));
      const laneMap = new Map<string, joint.shapes.standard.Rectangle>();
      
      // Calculate Dagre Layout for Y coords
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: 'TB', ranksep: VERTICAL_SPACING, nodesep: 100 });
      g.setDefaultEdgeLabel(() => ({}));

      g.setNode('Start', { width: 40, height: 40 });
      g.setNode('Inicio', { width: 160, height: 60 });
      pasos.forEach(p => g.setNode(p.id, { width: p.tipo === 'DECISION' ? 100 : 160, height: p.tipo === 'DECISION' ? 100 : 60 }));
      g.setNode('Notificacion', { width: 160, height: 60 });
      g.setNode('End', { width: 40, height: 40 });

      g.setEdge('Start', 'Inicio');
      
      if (pasos.length > 0) {
        g.setEdge('Inicio', pasos[0].id);
      } else {
        g.setEdge('Inicio', 'Notificacion');
      }

      pasos.forEach(p => {
        if (p.siguientes && Object.keys(p.siguientes).length > 0) {
            Object.values(p.siguientes).forEach(nextId => {
                g.setEdge(p.id, nextId);
            });
        } else {
            g.setEdge(p.id, 'Notificacion');
        }
      });
      g.setEdge('Notificacion', 'End');

      dagre.layout(g);

      // Determine maxHeight to resize lanes
      let maxY = 0;
      g.nodes().forEach(v => {
          const y = g.node(v).y;
          if (y > maxY) maxY = y;
      });
      const LANE_HEIGHT = Math.max(800, maxY + 200);

      // Draw Lanes
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
          body: { fill: 'transparent', stroke: '#475569', strokeWidth: 2, rx: 8, ry: 8 },
          label: { text: humanName, fill: '#F8FAFC', refY: 20, textAnchor: 'middle', fontWeight: 'bold', fontSize: 16 }
        });
        lane.addTo(this.graph);
        lane.toBack();
        laneMap.set(deptoId, lane);
      });

      const jointNodes = new Map<string, joint.dia.Element>();
      
      const createNode = (id: string, deptoId: string, tipo: 'estatico' | 'ACTIVIDAD' | 'DECISION', label: string, color: string) => {
          const lane = laneMap.get(deptoId) || laneMap.get('Cliente');
          const laneIndex = deptoIds.indexOf(deptoId === 'Cliente' ? 'Cliente' : deptoId || 'Cliente') === -1 ? 0 : deptoIds.indexOf(deptoId === 'Cliente' ? 'Cliente' : deptoId || 'Cliente');
          const dy = g.node(id).y;
          const dw = g.node(id).width;
          const dh = g.node(id).height;
          // Center in lane
          const x = 50 + (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2) - (dw / 2);
          const y = 80 + dy - (dh / 2); // Shift down a bit because lanes start at 50 Y

          let el: joint.dia.Element;
          
          if (tipo === 'DECISION') {
              el = new joint.shapes.standard.Polygon();
              el.resize(dw, dh);
              el.attr({
                  body: { refPoints: '0,50 50,0 100,50 50,100', fill: '#1E293B', stroke: '#F59E0B', strokeWidth: 2, magnet: true },
                  label: { text: joint.util.breakText(label, { width: dw - 20 }), fill: '#F8FAFC', fontSize: 11, refY: '50%', textVerticalAnchor: 'middle', pointerEvents: 'none' }
              });
          } else if (tipo === 'estatico' && id === 'Start') {
              el = new joint.shapes.standard.Circle();
              el.resize(dw, dh);
              el.attr({ body: { fill: '#F8FAFC', stroke: '#10B981', strokeWidth: 3, magnet: true }});
          } else if (tipo === 'estatico' && id === 'End') {
              el = new joint.shapes.standard.Circle();
              el.resize(dw, dh);
              el.attr({ body: { fill: '#F8FAFC', stroke: '#EF4444', strokeWidth: 4, magnet: true }});
          } else {
              el = new joint.shapes.standard.Rectangle();
              el.resize(dw, dh);
              el.attr({
                  body: { fill: '#1E293B', stroke: color, strokeWidth: 2, rx: 8, ry: 8, magnet: true },
                  label: { text: joint.util.breakText(label, { width: dw - 20 }), fill: color === '#F8FAFC' ? '#F8FAFC' : color, fontSize: 12, fontWeight: 'bold', pointerEvents: 'none' }
              });
          }
          
          el.position(x, y);
          el.prop('custom/stepId', id);
          el.addTo(this.graph);
          if (lane) lane.embed(el);
          jointNodes.set(id, el);
          return el;
      };

      createNode('Start', 'Cliente', 'estatico', '', '');
      createNode('Inicio', 'Cliente', 'estatico', 'Inicio de proceso', '#10B981');
      
      pasos.forEach(p => {
          createNode(p.id, p.departamentoId || 'Cliente', p.tipo || 'ACTIVIDAD', p.nombrePaso, '#8B5CF6');
      });

      createNode('Notificacion', 'Cliente', 'estatico', 'Notificación recibida', '#EF4444');
      createNode('End', 'Cliente', 'estatico', '', '');

      const linkFactory = (sId: string, tId: string, edgeLabel?: string) => {
          const s = jointNodes.get(sId);
          const t = jointNodes.get(tId);
          if (!s || !t) return;
          const link = new joint.shapes.standard.Link();
          link.source(s).target(t).router('manhattan', { step: 15, padding: 15 }).connector('rounded');
          link.attr({ line: { stroke: '#64748B', strokeWidth: 2, targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z', fill: '#64748B' } }});
          
          if (edgeLabel && edgeLabel !== 'default') {
              link.labels([{
                  attrs: {
                      text: { text: edgeLabel, fill: '#F8FAFC', fontSize: 11, fontFamily: 'sans-serif' },
                      rect: { fill: '#1E293B', stroke: '#475569', strokeWidth: 1, rx: 4, ry: 4 }
                  }
              }]);
          }
          link.addTo(this.graph);
      };

      g.edges().forEach(e => {
          // Si es un edge entre pasos (no estáticos), buscar su label en 'siguientes'
          if (e.v !== 'Start' && e.v !== 'Inicio' && e.v !== 'Notificacion' && e.w !== 'Notificacion') {
              const paso = pasos.find(p => p.id === e.v);
              if (paso && paso.siguientes) {
                  // Find exactly which key bridges to this target
                  const actionLabel = Object.keys(paso.siguientes).find(k => paso.siguientes[k] === e.w);
                  linkFactory(e.v, e.w, actionLabel);
              } else {
                  linkFactory(e.v, e.w);
              }
          } else {
              linkFactory(e.v, e.w);
          }
      });

      setTimeout(() => this.paper.scaleContentToFit({ padding: 50, minScale: 0.2, maxScale: 1 }), 50);
    });
  }

  public addTestNode(x: number, y: number, text: string) {
    this.zone.runOutsideAngular(() => {
      const rect = new joint.shapes.standard.Rectangle();
      rect.position(x, y);
      rect.resize(120, 50);
      rect.attr({
        body: { fill: '#1E293B', stroke: '#8B5CF6', strokeWidth: 2, rx: 8, ry: 8 },
        label: { text: text, fill: '#F8FAFC', fontSize: 12, fontFamily: 'sans-serif' }
      });
      rect.addTo(this.graph);
    });
  }
}
