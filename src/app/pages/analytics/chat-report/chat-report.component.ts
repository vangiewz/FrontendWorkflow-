import { Component, ElementRef, ViewChild, ChangeDetectorRef, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  role: 'user' | 'ia';
  content: string;
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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.messages.push({
      role: 'ia',
      content: '¡Hola! Soy tu asistente para generar reportes dinámicos. ¿Qué datos te gustaría visualizar hoy? (Ej: "Quiero un Excel con todos los trámites finalizados de Juan")'
    });
    this.initSpeechRecognition();
  }

  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
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

    this.messages.push({ role: 'user', content: this.userInput.trim() });
    const currentInput = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    const requestBody = {
      historial: this.messages
    };

    this.http.post(this.apiUrl, requestBody, {
      observe: 'response',
      responseType: 'blob'
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          // Es un JSON (Faltan datos)
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
          reader.readAsText(response.body);
        } else {
          // Es un archivo binario
          this.messages.push({ role: 'ia', content: '¡Reporte generado! Tu descarga debería comenzar en breve.' });
          
          let fileName = 'reporte';
          const contentDisposition = response.headers.get('content-disposition');
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
      },
      error: (err) => {
        this.isLoading = false;
        this.messages.push({ role: 'ia', content: 'Ocurrió un error al procesar tu solicitud.' });
        console.error(err);
        this.scrollToBottom();
        this.cdr.detectChanges();
      }
    });
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
