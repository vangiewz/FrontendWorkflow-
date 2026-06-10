import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ColaboracionSocketService {
  private client!: Client;
  private messageSubject = new Subject<any>();

  constructor() {}

  conectarYUnirse(tramiteId: string, archivoId: string): Observable<any> {
    this.client = new Client({
      webSocketFactory: () => {
        const SockJSConstructor = (SockJS as any).default || SockJS;
        const wsUrl = environment.apiUrl.replace('/api', '/ws-colaboracion');
        return new SockJSConstructor(wsUrl);
      },
      debug: (msg: string) => console.log(msg),
      reconnectDelay: 5000,
    });

    this.client.onConnect = (frame) => {
      console.log('✅✅✅ WEBSOCKET DE COLABORACIÓN CONECTADO ✅✅✅', frame);
      this.client.subscribe(`/topic/tramite/${tramiteId}/documento/${archivoId}`, (message: IMessage) => {
        if (message.body) {
          console.log('📥 DELTA RECIBIDO:', JSON.parse(message.body));
          this.messageSubject.next(JSON.parse(message.body));
        }
      });
      // Notificar conexión exitosa para disparar el REQUEST_STATE inmediatamente
      this.messageSubject.next({ type: '_INTERNAL_CONNECTED_' });
    };

    this.client.onWebSocketError = (error) => {
      console.error('❌❌❌ ERROR EN WEBSOCKET DE COLABORACIÓN ❌❌❌', error);
    };

    this.client.onStompError = (frame) => {
      console.error('❌❌❌ STOMP ERROR ❌❌❌', frame);
    };

    this.client.activate();
    return this.messageSubject.asObservable();
  }

  enviarDelta(tramiteId: string, archivoId: string, payload: any) {
    if (this.client && this.client.connected) {
      console.log('📤 ENVIANDO DELTA:', payload);
      this.client.publish({
        destination: `/app/tramite/${tramiteId}/documento/${archivoId}`,
        body: JSON.stringify(payload)
      });
    }
  }

  desconectar() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
