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

  private initStomp() {
    this.rxStomp = new RxStomp();
    
    const url = new URL(environment.apiUrl);
    const wsUrl = `ws://${url.host}/ws-workflow`;
    
    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
    });
    
    this.rxStomp.activate();
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

    // Notify others
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
