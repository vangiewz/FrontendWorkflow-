import { Component, inject, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from './dialog.service';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    @if (dialogState(); as state) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-surface-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" (click)="cancel()"></div>
        
        <!-- Modal -->
        <div class="relative w-full max-w-md p-6 bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" role="dialog" aria-modal="true">
          <h3 class="text-xl font-bold text-white mb-2">{{ state.title }}</h3>
          <p class="text-sm text-gray-400 mb-6 whitespace-pre-line">{{ state.message }}</p>
          
          @if (state.type === 'prompt') {
            <input 
              #promptInput
              type="text" 
              [(ngModel)]="promptValue"
              (keyup.enter)="confirm()"
              class="w-full bg-surface-800 border border-surface-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none mb-6 transition-all"
            >
          }

          <div class="flex justify-end gap-3 mt-4">
            <app-button variant="outline" size="sm" (click)="cancel()">
              {{ state.cancelText }}
            </app-button>
            <app-button 
              [variant]="state.isDanger ? 'danger' : 'primary'"
              size="sm" 
              (click)="confirm()">
              {{ state.confirmText }}
            </app-button>
          </div>
        </div>
      </div>
    }
  `
})
export class DialogComponent {
  dialogService = inject(DialogService);
  dialogState = this.dialogService.state;
  promptValue = '';

  promptInput = viewChild<ElementRef>('promptInput');

  constructor() {
    effect(() => {
      const state = this.dialogState();
      if (state && state.type === 'prompt') {
        this.promptValue = state.defaultValue || '';
        // Focus the input next tick
        setTimeout(() => {
          this.promptInput()?.nativeElement?.focus();
        }, 50);
      }
    });
  }

  cancel() {
    const state = this.dialogState();
    if (!state) return;
    this.dialogService.close(state.type === 'prompt' ? null : false);
  }

  confirm() {
    const state = this.dialogState();
    if (!state) return;
    this.dialogService.close(state.type === 'prompt' ? this.promptValue : true);
  }
}
