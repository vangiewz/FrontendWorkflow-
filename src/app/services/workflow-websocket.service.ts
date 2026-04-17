import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RxStomp } from '@stomp/rx-stomp';
import { environment } from '../environments/environment';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowWebsocketService {
  private rxStomp?: RxStomp;
  private readonly platformId = inject(PLATFORM_ID);
  
  public readonly joinEvents$ = new Subject<any>();
  public readonly moveEvents$ = new Subject<any>();
  public readonly editEvents$ = new Subject<any>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initStomp();
    }
  }

  private initStomp() {
    this.rxStomp = new RxStomp();
    
    // Asumimos environment.apiUrl como http://localhost:8080/api
    const url = new URL(environment.apiUrl);
    const wsUrl = `ws://${url.host}/ws-workflow`;
    
    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
    });
    
    this.rxStomp.activate();
  }

  public joinRoom(workflowId: string, userName: string) {
    if (!this.rxStomp) return;
    
    // Subscribe to events
    this.rxStomp.watch(`/topic/workflow/${workflowId}/join`).subscribe(msg => {
      this.joinEvents$.next(JSON.parse(msg.body));
    });
    this.rxStomp.watch(`/topic/workflow/${workflowId}/move`).subscribe(msg => {
      this.moveEvents$.next(JSON.parse(msg.body));
    });
    this.rxStomp.watch(`/topic/workflow/${workflowId}/edit`).subscribe(msg => {
      this.editEvents$.next(JSON.parse(msg.body));
    });

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
}
