import { Component, ElementRef, ViewChild, ChangeDetectorRef, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { environment } from '../../../environments/environment';
import { OfflineQueueService } from '../../../services/offline-queue.service';
import { NetworkStatusService } from '../../../services/network-status.service';

interface ChatMessage {
  role: 'user' | 'ia';
  content: string;
  isPending?: boolean;
}

@Component({
  selector: 'app-chat-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  templateUrl: './chat-report.component.html',
  styleUrls: ['./chat-report.component.css']
})
export class ChatReportComponent implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isListening: boolean = false;
  recognition: any;
  mobileSidebarOpen = signal(false);

  private apiUrl = environment.aiUrl + '/workflows/ai/reports/chat';
  public offlineQueue = inject(OfflineQueueService);
  public networkStatus = inject(NetworkStatusService);
  private syncSubscription: any;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.messages.push({
      role: 'ia',
      content: '¡Hola! Soy tu asistente para generar reportes dinámicos. ¿Qué datos te gustaría visualizar hoy? (Ej: "Quiero un Excel con todos los trámites finalizados de Juan")'
    });
    this.initSpeechRecognition();

    this.syncSubscription = this.offlineQueue.syncCompleted$.subscribe(event => {
      if (event.request.url.includes('/workflows/ai/reports/chat')) {
        const pendingMsg = this.messages.find(m => m.isPending);
        if (pendingMsg) {
          pendingMsg.isPending = false;
        }
        
        if (event.success && event.response) {
           this.procesarRespuestaChat(event.response);
        } else {
           this.messages.push({ role: 'ia', content: 'Hubo un error al procesar tu reporte guardado sin conexión.' });
           this.isLoading = false;
           this.scrollToBottom();
           this.cdr.detectChanges();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'es-ES';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.cdr.detectChanges();
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.userInput += (this.userInput ? ' ' : '') + transcript;
        this.cdr.detectChanges();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.isListening = false;
        this.cdr.detectChanges();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.cdr.detectChanges();
        // Opcionalmente enviar automático: this.sendMessage();
      };
    } else {
      console.warn('Speech Recognition API no está soportada en este navegador.');
    }
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  toggleListening() {
    if (this.isListening) {
      this.recognition.stop();
    } else {
      if (this.recognition) {
        this.recognition.start();
      } else {
        alert('Tu navegador no soporta el reconocimiento de voz.');
      }
    }
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const currentInput = this.userInput.trim();
    this.userInput = '';

    this.messages.push({ role: 'user', content: currentInput });
    this.isLoading = true;
    this.scrollToBottom();

    const requestBody = {
      historial: this.messages
        .filter(m => m.role === 'user' || (m.role === 'ia' && !m.content.includes('error al procesar')))
        .map(m => ({ role: m.role, content: m.content }))
    };

    let targetUrl = this.apiUrl;
    if (!this.networkStatus.isOnline()) {
      targetUrl = 'http://localhost:8000/api/workflows/ai/reports/chat';
      console.log('Modo sin conexión activado: Redirigiendo petición a localhost...');
    }

    this.http.post(targetUrl, requestBody, {
      headers: { 'X-Skip-Offline-Interceptor': 'true' },
      observe: 'response',
      responseType: 'blob'
    }).subscribe({
      next: (response: any) => this.procesarRespuestaChat(response),
      error: (err) => {
        this.isLoading = false;
        this.messages.push({ role: 'ia', content: 'Ocurrió un error al procesar tu solicitud.' });
        console.error(err);
        this.scrollToBottom();
        this.cdr.detectChanges();
      }
    });
  }

  procesarRespuestaChat(response: any) {
    if (response.status === 202 && response.body?.queued) {
       this.isLoading = false;
       const lastUserMsg = [...this.messages].reverse().find(m => m.role === 'user');
       if (lastUserMsg) lastUserMsg.isPending = true;
       this.scrollToBottom();
       this.cdr.detectChanges();
       return;
    }

    this.isLoading = false;
    const contentType = response.headers?.get('content-type') || response.headers?.['content-type'] || '';

    if (contentType.includes('application/json')) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const resJson = JSON.parse(reader.result as string);
          if (resJson.estado === 'INCOMPLETO') {
            this.messages.push({ role: 'ia', content: resJson.mensaje_usuario });
          } else if (resJson.error) {
            this.messages.push({ role: 'ia', content: `Error: ${resJson.error}` });
          }
          this.scrollToBottom();
          this.cdr.detectChanges();
        } catch (e) {
          console.error("Error parseando JSON", e);
        }
      };
      try {
         reader.readAsText(response.body);
      } catch (err) {
         console.error('readAsText error:', err);
      }
    } else {
      this.messages.push({ role: 'ia', content: '¡Reporte generado! Tu descarga debería comenzar en breve.' });
      
      let fileName = 'reporte';
      const contentDisposition = response.headers?.get('content-disposition') || response.headers?.['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        fileName = contentDisposition.split('filename=')[1].trim();
      }

      const url = window.URL.createObjectURL(response.body);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      this.scrollToBottom();
      this.cdr.detectChanges();
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }, 100);
  }
}
