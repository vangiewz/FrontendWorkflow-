import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tramite-form-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass rounded-2xl p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-white">
             {{ step?.nombrePaso }}
             @if (isReadOnly) { <span class="ml-2 text-xs bg-surface-700 text-gray-300 px-2 py-1 rounded">Solo Lectura</span> }
          </h2>
          <p class="text-xs text-gray-400 mt-1">
            {{ step?.tipo === 'DECISION' ? 'Nodo de Decision' : 'Actividad' }} -
            {{ departamentoName }}
          </p>
        </div>
        @if (step?.tipo === 'DECISION') {
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><span class="text-amber-400 font-bold">?</span></div>
        } @else {
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><span class="text-blue-400 font-bold">?</span></div>
        }
      </div>

      @if (step?.tipo === 'DECISION') {
        @if (!isReadOnly) {
          @if (canRespond) {
            <div class="space-y-3">
              <p class="text-sm text-gray-300 mb-4">Seleccione la decision para continuar con el flujo:</p>
              @for (opcion of getDecisionOpciones(step); track opcion) {
                <button
                  (click)="opcionSeleccionada.emit(opcion)"
                  class="w-full flex items-center justify-between p-4 rounded-xl bg-surface-800 border border-surface-700 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200 group"
                  [disabled]="isSubmitting"
                >
                  <span class="text-sm font-medium text-gray-200 group-hover:text-white">{{ opcion }}</span>
                  <svg class="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
                </button>
              }
            </div>
          } @else {
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p class="text-sm font-medium text-red-400">Paso asignado a: {{ departamentoName }}</p>
              <p class="text-xs text-gray-400 mt-1">No tienes permisos para tomar esta decision.</p>
            </div>
          }
        } @else {
          <div class="p-4 bg-surface-800 border border-surface-700 rounded-xl text-center">
            <p class="text-sm font-medium text-gray-400">Decision enviada:</p>
            <p class="text-lg font-bold text-violet-400 mt-1">{{ formAnswers['decision'] || 'N/A' }}</p>
          </div>
        }
      } @else {
        @if (!isReadOnly && !canRespond && !step?.departamentoId) {
          <div class="p-6 text-center bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <p class="text-sm font-medium text-violet-400">Esperando respuesta del Cliente</p>
            <p class="text-xs text-gray-400 mt-2">Este paso requiere intervencion del cliente a traves de la aplicacion movil.</p>
          </div>
        } @else {
          @if (!isReadOnly && !canRespond) {
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center mb-4">
              <p class="text-sm font-medium text-red-400">Paso asignado a: {{ departamentoName }}</p>
              <p class="text-xs text-gray-400 mt-1">No posees permisos para interactuar.</p>
            </div>
          }

          <div class="space-y-4" [class.opacity-60]="!canRespond && !isReadOnly">
            @if (!isReadOnly && canRespond && step?.tipo !== 'DECISION') {
              <div class="p-4 rounded-xl border border-violet-500/30 bg-violet-500/10 space-y-3">
                <p class="text-xs text-violet-200 font-semibold uppercase tracking-wide">Asistente IA</p>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    class="flex-1 bg-surface-900 border border-violet-400/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Describe por chat como llenar el formulario"
                    [value]="chatPrompt"
                    [disabled]="isAssisting"
                    (input)="chatPrompt = $any($event.target).value"
                  >
                  <button
                    type="button"
                    class="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-500 transition-colors disabled:opacity-50"
                    [disabled]="isAssisting"
                    (click)="solicitarAsistenciaChat()"
                  >
                    {{ isAssisting ? 'Procesando...' : 'Autocompletar' }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50"
                    [disabled]="isAssisting"
                    [class.border-rose-400]="isListening"
                    [class.text-rose-300]="isListening"
                    [class.bg-rose-500/20]="isListening"
                    [class.border-surface-600]="!isListening"
                    [class.text-gray-300]="!isListening"
                    [class.bg-surface-800]="!isListening"
                    (click)="toggleVoiceInput()"
                  >
                    {{ isListening ? 'Detener Voz' : 'Usar Voz' }}
                  </button>
                </div>
                <p class="text-[11px] text-violet-100/85">{{ voiceStatus }}</p>
              </div>
            }

            @if (formFields.length > 0) {
              @for (field of formFields; track field.key) {
                <div>
                  <label class="text-xs block mb-1"
                    [class.text-gray-400]="!field.required"
                    [class.text-gray-300]="field.required">
                    {{ field.label }}
                    @if (field.required && !isReadOnly) { <span class="text-red-400 ml-0.5">*</span> }
                  </label>

                  @if (isReadOnly) {
                    <div class="w-full bg-surface-800 border border-surface-700 rounded-lg p-3 text-sm text-gray-300">
                      {{ formattedAnswerValue(field.key, field.type) }}
                    </div>
                  } @else {
                    @if (field.type === 'textarea') {
                      <textarea
                        class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none"
                        [class.border-surface-700]="!field.required || formData[field.key]"
                        [class.border-red-500/40]="field.required && !formData[field.key]"
                        rows="3" [placeholder]="field.label"
                        [value]="formData[field.key] ?? ''"
                        [disabled]="!canRespond"
                        (input)="formData[field.key] = $any($event.target).value"
                      ></textarea>
                    } @else if (field.type === 'select' && field.options) {
                      <select
                        class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all appearance-none"
                        [class.border-surface-700]="!field.required || formData[field.key]"
                        [class.border-red-500/40]="field.required && !formData[field.key]"
                        [value]="formData[field.key] ?? ''"
                        [disabled]="!canRespond"
                        (change)="formData[field.key] = $any($event.target).value"
                      >
                        <option value="">- Seleccione -</option>
                        @for (opt of field.options; track opt) { <option [value]="opt">{{ opt }}</option> }
                      </select>
                    } @else if (field.type === 'boolean') {
                      <label class="flex items-center gap-3 p-3 bg-surface-900 border border-surface-700 rounded-lg"
                        [class.cursor-pointer]="canRespond">
                        <input type="checkbox"
                          class="w-4 h-4 rounded border-surface-600 text-purple-500 focus:ring-purple-500 bg-surface-700"
                          [checked]="!!formData[field.key]"
                          [disabled]="!canRespond"
                          (change)="formData[field.key] = $any($event.target).checked">
                        <span class="text-sm text-gray-300">{{ field.label }}</span>
                      </label>
                    } @else {
                      <input
                        [type]="field.type || 'text'"
                        class="w-full bg-surface-900 border rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                        [class.border-surface-700]="!field.required || formData[field.key]"
                        [class.border-red-500/40]="field.required && !formData[field.key]"
                        [placeholder]="field.label + (field.required ? ' (obligatorio)' : '')"
                        [value]="formData[field.key] ?? ''"
                        [disabled]="!canRespond"
                        (input)="formData[field.key] = $any($event.target).value"
                        (change)="formData[field.key] = $any($event.target).value"
                      >
                    }
                  }
                </div>
              }
            } @else {
              <div class="p-4 bg-surface-800 rounded-xl text-center">
                <p class="text-xs text-gray-400">Este paso no tiene formulario. Presiona completar para avanzar.</p>
              </div>
            }

            @if (!isReadOnly && canRespond) {
              @if (!isFormValid()) {
                <p class="text-[11px] text-red-400/70 mt-2">* Complete todos los campos obligatorios</p>
              }
              <button
                class="w-full mt-4 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200"
                [class.bg-purple-600]="isFormValid() && !isSubmitting"
                [class.hover:bg-purple-500]="isFormValid() && !isSubmitting"
                [class.text-white]="isFormValid() && !isSubmitting"
                [class.bg-surface-700]="!isFormValid() || isSubmitting"
                [class.text-gray-500]="!isFormValid() || isSubmitting"
                [class.cursor-not-allowed]="!isFormValid() || isSubmitting"
                (click)="submitForm()"
              >
                {{ isSubmitting ? 'Procesando...' : 'Completar Paso' }}
              </button>
            }
          </div>
        }
      }
    </div>
  `
})
export class TramiteFormViewerComponent implements OnChanges {
  private static readonly VOICE_UNSUPPORTED = 'VOICE_UNSUPPORTED';
  private static readonly VOICE_ERROR_PREFIX = 'VOICE_ERROR:';

  @Input() step: any = null;
  @Input() departamentoName = '';
  @Input() isReadOnly = false;
  @Input() canRespond = false;
  @Input() formAnswers: Record<string, any> = {};
  @Input() isSubmitting = false;
  @Input() iaPrefill: Record<string, unknown> | null = null;
  @Input() isAssisting = false;

  @Output() opcionSeleccionada = new EventEmitter<string>();
  @Output() formularioEnviado = new EventEmitter<Record<string, any>>();
  @Output() asistenciaSolicitada = new EventEmitter<{ modo: 'chat' | 'voz'; mensaje: string }>();

  formData: Record<string, any> = {};
  formFields: any[] = [];
  chatPrompt = '';
  isListening = false;
  voiceStatus = 'Pulsa "Usar Voz" y habla despues de ver "Escuchando".';

  private speechRecognition: {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onstart: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['step']) {
      this.formData = {};
      this.formFields = this.step?.formularioJson ? this.buildFormFields(this.step.formularioJson) : [];
      this.chatPrompt = '';
      this.voiceStatus = 'Pulsa "Usar Voz" y habla despues de ver "Escuchando".';
      this.stopListening();
    }
    if (changes['isReadOnly'] && this.isReadOnly && this.formAnswers) {
      this.formData = { ...this.formAnswers };
    }
    if (changes['formAnswers'] && this.isReadOnly) {
      this.formData = { ...this.formAnswers };
    }
    if (changes['iaPrefill'] && this.iaPrefill && !this.isReadOnly) {
      this.aplicarSugerencia(this.iaPrefill);
    }
  }

  submitForm() {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.formularioEnviado.emit({ ...this.formData });
  }

  solicitarAsistenciaChat() {
    const mensaje = this.chatPrompt.trim();
    if (!mensaje || this.isReadOnly || !this.canRespond || this.isAssisting) return;
    this.voiceStatus = 'Procesando solicitud por chat con IA...';
    this.asistenciaSolicitada.emit({ modo: 'chat', mensaje });
  }

  toggleVoiceInput() {
    if (this.isReadOnly || !this.canRespond || this.isAssisting) {
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    const recognition = this.createSpeechRecognition();
    if (!recognition) {
      this.asistenciaSolicitada.emit({ modo: 'voz', mensaje: TramiteFormViewerComponent.VOICE_UNSUPPORTED });
      return;
    }

    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.voiceStatus = 'Escuchando... habla ahora y luego pulsa "Detener Voz".';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      this.chatPrompt = transcript;
      const clean = transcript.trim();
      if (clean) {
        this.voiceStatus = 'Procesando transcripcion con IA...';
        this.asistenciaSolicitada.emit({ modo: 'voz', mensaje: clean });
      }
    };

    recognition.onerror = (event) => {
      this.isListening = false;
      this.speechRecognition = null;
      const errorCode = event.error ?? 'unknown';
      this.voiceStatus = 'No se pudo capturar audio. Revisa permisos de microfono e intentalo de nuevo.';
      this.asistenciaSolicitada.emit({
        modo: 'voz',
        mensaje: `${TramiteFormViewerComponent.VOICE_ERROR_PREFIX}${errorCode}`
      });
    };

    recognition.onend = () => {
      this.isListening = false;
      this.speechRecognition = null;
      if (!this.isAssisting) {
        this.voiceStatus = 'Voz detenida. Puedes grabar de nuevo o usar chat.';
      }
    };

    this.speechRecognition = recognition;
    this.isListening = true;
    try {
      recognition.start();
    } catch {
      this.isListening = false;
      this.speechRecognition = null;
      this.voiceStatus = 'No se pudo iniciar el reconocimiento de voz en este navegador.';
      this.asistenciaSolicitada.emit({ modo: 'voz', mensaje: TramiteFormViewerComponent.VOICE_UNSUPPORTED });
    }
  }

  getDecisionOpciones(paso: any): string[] {
    return paso?.siguientes ? Object.keys(paso.siguientes) : [];
  }

  formattedAnswerValue(key: string, type: string): string {
    const val = this.formData[key];
    if (val === undefined || val === null || val === '') return 'N/A';
    if (type === 'boolean') return val ? 'Si' : 'No';
    return val.toString();
  }

  buildFormFields(schema: Record<string, any>): any[] {
    if (!schema || !schema['properties']) return [];
    const props = schema['properties'] as Record<string, any>;
    const requiredFields: string[] = schema['required'] || [];
    return Object.entries(props).map(([key, val]) => {
      let type = 'text';
      if (val?.type === 'boolean') {
        type = 'boolean';
      } else if (val?.type === 'integer' || val?.type === 'number') {
        type = 'number';
      } else if (val?.type === 'string') {
        if (val?.enum) type = 'select';
        else if (val?.format === 'date') type = 'date';
        else if (val?.format === 'date-time') type = 'datetime-local';
        else if (val?.format === 'textarea') type = 'textarea';
        else type = 'text';
      }
      return {
        key,
        label: val?.title || val?.description || key,
        type,
        required: requiredFields.includes(key),
        options: val?.enum
      };
    });
  }

  isFormValid(): boolean {
    const schema = this.step?.formularioJson;
    if (!schema || !schema['required']) return true;
    const requiredFields: string[] = schema['required'];
    return requiredFields.every((key) => {
      const val = this.formData[key];
      return val !== undefined && val !== null && val !== '';
    });
  }

  private createSpeechRecognition(): {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onstart: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null {
    const maybeWindow = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: ((event: { error?: string }) => void) | null;
        onstart: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: ((event: { error?: string }) => void) | null;
        onstart: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const Ctor = maybeWindow.SpeechRecognition ?? maybeWindow.webkitSpeechRecognition;
    if (!Ctor) {
      return null;
    }
    return new Ctor();
  }

  private stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
    }
    this.isListening = false;
    this.speechRecognition = null;
    this.voiceStatus = 'Voz detenida. Puedes grabar de nuevo o usar chat.';
  }

  private aplicarSugerencia(sugerencia: Record<string, unknown>) {
    for (const field of this.formFields) {
      const key = String(field.key);
      if (Object.prototype.hasOwnProperty.call(sugerencia, key)) {
        this.formData[key] = sugerencia[key];
      }
    }
  }
}
