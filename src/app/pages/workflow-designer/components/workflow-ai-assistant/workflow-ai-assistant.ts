import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  WorkflowAiAssistResponse,
  WorkflowAiCorrection,
  WorkflowService
} from '../../../../services/workflow.service';
import { WorkflowStateService } from '../../services/workflow-state.service';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ButtonComponent } from '../../../../shared/button/button';

interface AssistantUiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  guiaUso: string[];
  correcciones: WorkflowAiCorrection[];
  workflowSugerido: WorkflowAiAssistResponse['workflowSugerido'];
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type BrowserSpeechWindow = Window & {
  webkitSpeechRecognition?: SpeechRecognitionCtor;
  SpeechRecognition?: SpeechRecognitionCtor;
};

@Component({
  selector: 'app-workflow-ai-assistant',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border border-surface-700 bg-surface-900/70 p-3 flex flex-col flex-1 min-h-115">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-xs font-semibold text-emerald-400">Asistente Operativo IA</h3>
        <span class="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-gray-300">
          {{ modeLabel() }}
        </span>
      </div>

      <p class="mt-1 text-[11px] text-gray-400">
        Te guía en creación/edición, valida inconsistencias y sugiere correcciones aplicables.
      </p>

      <div class="mt-3 flex-1 min-h-45 overflow-y-auto rounded-lg border border-surface-700 bg-surface-950/70 p-2">
        @for (msg of messages(); track msg.id) {
          <article class="mb-2 rounded-lg border p-2"
            [class.border-emerald-500/20]="msg.role === 'assistant'"
            [class.bg-emerald-500/5]="msg.role === 'assistant'"
            [class.border-surface-700]="msg.role === 'user'"
            [class.bg-surface-900]="msg.role === 'user'"
          >
            <p class="text-[10px] uppercase tracking-wide"
              [class.text-emerald-300]="msg.role === 'assistant'"
              [class.text-gray-400]="msg.role === 'user'"
            >
              {{ msg.role === 'assistant' ? 'Asistente' : 'Operador' }}
            </p>
            <p class="mt-1 text-xs text-gray-100 whitespace-pre-wrap">{{ msg.text }}</p>

            @if (msg.guiaUso.length > 0) {
              <div class="mt-2 rounded-md border border-sky-500/20 bg-sky-500/5 p-2">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-sky-300">Guía rápida</p>
                <ul class="mt-1 list-disc pl-4 text-[11px] text-sky-100">
                  @for (item of msg.guiaUso; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </div>
            }

            @if (msg.correcciones.length > 0) {
              <div class="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Correcciones</p>
                @for (issue of msg.correcciones; track issue.titulo + issue.accion) {
                  <div class="mt-1 rounded border border-amber-500/10 bg-surface-900/40 p-1.5">
                    <p class="text-[11px] font-semibold text-amber-200">{{ issue.severidad }} · {{ issue.titulo }}</p>
                    <p class="text-[11px] text-gray-300">{{ issue.detalle }}</p>
                    <p class="text-[11px] text-emerald-300">Acción: {{ issue.accion }}</p>
                  </div>
                }
              </div>
            }

            @if (msg.workflowSugerido) {
              <div class="mt-2 flex justify-end">
                <app-button variant="outline" size="sm" (click)="aplicarSugerencia(msg.workflowSugerido)">
                  Aplicar Sugerencia
                </app-button>
              </div>
            }
          </article>
        }
      </div>

      <div class="mt-3 flex flex-col gap-2 border-t border-surface-800 pt-3">
        <textarea
          [formControl]="assistantPromptCtrl"
          rows="3"
          class="w-full rounded-lg border border-surface-700 bg-surface-800 p-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Pregunta o instrucción para mejorar el workflow actual..."
        ></textarea>

        <div class="flex items-center gap-2">
          <app-button variant="primary" size="sm" class="flex-1" (click)="enviarPrompt()" [disabled]="isLoading() || !assistantPromptCtrl.value">
            {{ isLoading() ? 'Analizando...' : 'Enviar al Asistente' }}
          </app-button>
          <app-button variant="outline" size="sm" (click)="toggleVoiceInput()" [disabled]="!voiceInputSupported()">
            {{ isListening() ? 'Detener Voz' : 'Hablar' }}
          </app-button>
        </div>

        <label class="flex items-center gap-2 text-[11px] text-gray-300">
          <input type="checkbox" [checked]="voiceOutputEnabled()" (change)="toggleVoiceOutput()" />
          Reproducir respuestas por voz
        </label>
        <p class="text-[10px] text-gray-400">
          Cuando está activado, el asistente lee en voz alta sus respuestas para facilitar uso manos libres.
        </p>

        @if (!voiceInputSupported()) {
          <p class="text-[11px] text-amber-300">El navegador actual no soporta reconocimiento de voz.</p>
        }
      </div>
    </section>
  `
})
export class WorkflowAiAssistantComponent {
  private readonly workflowState = inject(WorkflowStateService);
  private readonly workflowService = inject(WorkflowService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  assistantPromptCtrl = this.fb.control('');
  messages = signal<AssistantUiMessage[]>([
    {
      id: this.createMessageId(),
      role: 'assistant',
      text: 'Estoy listo para ayudarte a construir o corregir este workflow. Puedes escribir o hablar.',
      guiaUso: ['Describe qué deseas lograr', 'Pide validación de rutas', 'Aplica sugerencias cuando lo necesites'],
      correcciones: [],
      workflowSugerido: null
    }
  ]);
  isLoading = signal(false);
  isListening = signal(false);
  voiceOutputEnabled = signal(true);

  modeLabel = computed(() => this.workflowState.isEditMode() ? 'Modo Edición' : 'Modo Creación');

  private recognition: SpeechRecognitionLike | null = null;
  private messageSequence = 0;
  voiceInputSupported = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const browserWindow = window as BrowserSpeechWindow;
      this.voiceInputSupported.set(Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition));
    }

    this.destroyRef.onDestroy(() => {
      this.recognition?.stop();
      if (isPlatformBrowser(this.platformId) && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    });
  }

  enviarPrompt() {
    const prompt = (this.assistantPromptCtrl.value ?? '').trim();
    if (!prompt || this.isLoading()) {
      return;
    }

    this.pushUserMessage(prompt);
    this.assistantPromptCtrl.setValue('');
    this.isLoading.set(true);

    const user = this.authService.getUser();
    const payload = {
      prompt,
      operatorRole: user?.rol ?? 'ADMIN',
      mode: this.workflowState.isEditMode() ? 'edit' : 'create',
      workflowDraft: this.buildWorkflowDraft()
    } as const;

    this.workflowService.assistWorkflowWithAi(payload).subscribe({
      next: (rawResponse) => {
        const parsed = this.parseAssistantResponse(rawResponse);
        this.pushAssistantMessage(parsed);
        if (this.voiceOutputEnabled()) {
          this.speak(parsed.respuesta);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('No se pudo consultar el asistente de workflow.');
      }
    });
  }

  toggleVoiceInput() {
    if (!this.voiceInputSupported()) {
      this.toast.error('Reconocimiento de voz no disponible en este navegador.');
      return;
    }

    if (this.isListening()) {
      this.recognition?.stop();
      this.isListening.set(false);
      return;
    }

    this.startVoiceInput();
  }

  toggleVoiceOutput() {
    this.voiceOutputEnabled.update((value) => !value);
  }

  aplicarSugerencia(sugerencia: WorkflowAiAssistResponse['workflowSugerido']) {
    if (!sugerencia) {
      return;
    }

    const categoria = sugerencia.categoria ?? 'INTERNO';
    const costoBase = categoria === 'INTERNO' ? 0 : Number(sugerencia.costoBase ?? 0);

    this.workflowState.setWorkflowMetadata(
      sugerencia.nombreTramite || this.workflowState.workflowNombre(),
      sugerencia.descripcionTramite || this.workflowState.workflowDescripcion(),
      categoria,
      costoBase
    );
    this.workflowState.setFormularioCliente(sugerencia.formularioCliente || {});
    this.workflowState.setPasos(sugerencia.pasos || []);
    this.toast.success('Sugerencia IA aplicada al editor.');
  }

  private startVoiceInput() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const browserWindow = window as BrowserSpeechWindow;
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    this.recognition = new Recognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;

    this.recognition.onresult = (event) => {
      const firstResult = event.results[0];
      const transcript = firstResult && firstResult[0] ? firstResult[0].transcript.trim() : '';
      if (transcript.length > 0) {
        this.assistantPromptCtrl.setValue(transcript);
        this.toast.success('Texto de voz capturado.');
      }
    };

    this.recognition.onerror = () => {
      this.isListening.set(false);
      this.toast.error('No se pudo procesar el audio.');
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
    };

    this.recognition.start();
    this.isListening.set(true);
  }

  private speak(text: string) {
    if (!isPlatformBrowser(this.platformId) || !('speechSynthesis' in window)) {
      return;
    }

    const content = text.trim();
    if (!content) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  private pushUserMessage(text: string) {
    this.messages.update((items) => [
      ...items,
      {
        id: this.createMessageId(),
        role: 'user',
        text,
        guiaUso: [],
        correcciones: [],
        workflowSugerido: null
      }
    ]);
  }

  private pushAssistantMessage(response: WorkflowAiAssistResponse) {
    this.messages.update((items) => [
      ...items,
      {
        id: this.createMessageId(),
        role: 'assistant',
        text: response.respuesta,
        guiaUso: response.guiaUso,
        correcciones: response.correccionesDetectadas,
        workflowSugerido: response.workflowSugerido
      }
    ]);
  }

  private buildWorkflowDraft(): Record<string, unknown> {
    return {
      id: this.workflowState.workflowId(),
      nombre: this.workflowState.workflowNombre(),
      descripcion: this.workflowState.workflowDescripcion(),
      categoria: this.workflowState.workflowCategoria(),
      costoBase: this.workflowState.workflowCostoBase(),
      formularioCliente: this.workflowState.formularioCliente(),
      pasos: this.workflowState.pasos()
    };
  }

  private parseAssistantResponse(raw: string): WorkflowAiAssistResponse {
    const normalized = this.normalizeJson(raw);

    try {
      const parsedUnknown: unknown = JSON.parse(normalized);
      if (!this.isAssistResponse(parsedUnknown)) {
        throw new Error('Formato inesperado');
      }
      return parsedUnknown;
    } catch {
      return {
        respuesta: 'No pude estructurar la respuesta del asistente. Intenta reformular la instrucción.',
        guiaUso: [],
        correccionesDetectadas: [],
        workflowSugerido: null
      };
    }
  }

  private normalizeJson(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('```')) {
      return trimmed;
    }
    return trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  private isAssistResponse(value: unknown): value is WorkflowAiAssistResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const obj = value as Record<string, unknown>;
    return typeof obj['respuesta'] === 'string'
      && Array.isArray(obj['guiaUso'])
      && Array.isArray(obj['correccionesDetectadas'])
      && (obj['workflowSugerido'] === null || typeof obj['workflowSugerido'] === 'object');
  }

  private createMessageId(): string {
    this.messageSequence += 1;
    return `m_${Date.now()}_${this.messageSequence}`;
  }
}
