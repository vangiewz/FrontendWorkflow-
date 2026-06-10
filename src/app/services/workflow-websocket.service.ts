import { Injectable, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RxStomp } from '@stomp/rx-stomp';
import { environment } from '../environments/environment';
import { Subject, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowWebsocketService implements OnDestroy {
  private rxStomp?: RxStomp;
  private readonly platformId = inject(PLATFORM_ID);
  private subscriptions: Subscription[] = [];
  private currentWorkflowId: string | null = null;
  
  public readonly joinEvents$ = new Subject<any>();
  public readonly moveEvents$ = new Subject<any>();
  public readonly editEvents$ = new Subject<any>();
  public readonly syncEvents$ = new Subject<any>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initStomp();
    }
  }

  private buildWsUrl(): string {
    const apiUrl = environment.apiUrl; // e.g. https://host/api
    const url = new URL(apiUrl);
    // Mapear el protocolo HTTP→WS y HTTPS→WSS correctamente
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Endpoint WebSocket nativo (sin SockJS) — el backend lo expone en /ws-workflow
    return `${wsProtocol}//${url.host}/ws-workflow`;
  }

  private initStomp() {
    this.rxStomp = new RxStomp();
    
    const wsUrl = this.buildWsUrl();
    console.log('[WebSocket] Conectando a:', wsUrl);
    
    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      // Logs solo en dev
      debug: environment.production ? () => {} : (msg: string) => console.log('[STOMP]', msg)
    });
    
    this.rxStomp.activate();

    this.rxStomp.connected$.subscribe(() =>
      console.log('[WebSocket] Conexión STOMP establecida ✓')
    );
    this.rxStomp.webSocketErrors$.subscribe((err: Event) =>
      console.error('[WebSocket] Error de conexión:', err)
    );
    this.rxStomp.stompErrors$.subscribe((frame: any) =>
      console.error('[WebSocket] Error STOMP:', frame)
    );
  }

  public leaveRoom() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    this.currentWorkflowId = null;
  }

  public joinRoom(workflowId: string, userName: string) {
    if (!this.rxStomp) return;
    
    // Limpiar suscripciones anteriores si se cambia de sala
    this.leaveRoom();
    this.currentWorkflowId = workflowId;

    // Subscribe to events
    this.subscriptions.push(
      this.rxStomp.watch(`/topic/workflow/${workflowId}/join`).subscribe(msg => {
        this.joinEvents$.next(JSON.parse(msg.body));
      }),
      this.rxStomp.watch(`/topic/workflow/${workflowId}/move`).subscribe(msg => {
        this.moveEvents$.next(JSON.parse(msg.body));
      }),
      this.rxStomp.watch(`/topic/workflow/${workflowId}/edit`).subscribe(msg => {
        this.editEvents$.next(JSON.parse(msg.body));
      }),
      this.rxStomp.watch(`/topic/workflow/${workflowId}/sync`).subscribe(msg => {
        this.syncEvents$.next(JSON.parse(msg.body));
      })
    );

    // Notify others that we joined
    this.rxStomp.publish({
      destination: `/app/workflow/${workflowId}/join`,
      body: JSON.stringify({ usuarioNombre: userName, accion: 'JOIN' })
    });
  }

  public notifyMove(workflowId: string, eventDetails: any) {
    if (!this.rxStomp) return;
    this.rxStomp.publish({
      destination: `/app/workflow/${workflowId}/move`,
      body: JSON.stringify(eventDetails)
    });
  }

  public notifyEdit(workflowId: string, eventDetails: any) {
    if (!this.rxStomp) return;
    this.rxStomp.publish({
      destination: `/app/workflow/${workflowId}/edit`,
      body: JSON.stringify(eventDetails)
    });
  }

  /**
   * Envía el estado completo del workflow a todos los demás admins
   * conectados a la misma sesión de edición.
   */
  public syncFullState(workflowId: string, state: any) {
    if (!this.rxStomp) return;
    this.rxStomp.publish({
      destination: `/app/workflow/${workflowId}/sync`,
      body: JSON.stringify(state)
    });
  }

  ngOnDestroy() {
    this.leaveRoom();
    this.rxStomp?.deactivate();
  }
}
