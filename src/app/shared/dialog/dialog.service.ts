import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface DialogOptions {
  title: string;
  message: string;
  type: 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  isDanger?: boolean;
}

export interface DialogState extends DialogOptions {
  isOpen: boolean;
  onClose: Subject<string | boolean | null>;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  state = signal<DialogState | null>(null);

  confirm(title: string, message: string, isDanger = false, confirmText = 'Aceptar'): Observable<boolean> {
    const defaultOptions: DialogOptions = {
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText: 'Cancelar',
      isDanger
    };
    return this.openDialog<boolean>(defaultOptions);
  }

  prompt(title: string, message: string, defaultValue = ''): Observable<string | null> {
    const defaultOptions: DialogOptions = {
      title,
      message,
      type: 'prompt',
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
      defaultValue,
      isDanger: false
    };
    return this.openDialog<string | null>(defaultOptions);
  }

  private openDialog<T>(options: DialogOptions): Observable<T> {
    const onClose = new Subject<T>();
    
    this.state.set({
      ...options,
      isOpen: true,
      onClose: onClose as any
    });

    return onClose.asObservable();
  }

  close(result: string | boolean | null) {
    const currentState = this.state();
    if (currentState) {
      currentState.onClose.next(result);
      currentState.onClose.complete();
      this.state.set(null);
    }
  }
}
