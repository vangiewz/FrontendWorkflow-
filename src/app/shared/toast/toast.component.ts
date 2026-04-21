import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.messages(); track toast.id) {
        <div 
          class="pointer-events-auto rounded-lg px-4 py-3 shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 flex items-center justify-between min-w-[250px] max-w-sm"
          [ngClass]="{
            'bg-emerald-900/90 text-emerald-100 border border-emerald-500/50': toast.type === 'success',
            'bg-red-900/90 text-red-100 border border-red-500/50': toast.type === 'error',
            'bg-surface-800/90 text-gray-200 border border-surface-600': toast.type === 'info'
          }"
          role="alert"
        >
          <div class="flex items-center gap-3">
             @if (toast.type === 'success') {
                <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
             }
             @if (toast.type === 'error') {
                <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
             }
             @if (toast.type === 'info') {
                <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             }
            <span class="text-sm font-medium tracking-wide">{{ toast.message }}</span>
          </div>
          <button (click)="toastService.remove(toast.id)" class="text-gray-400 hover:text-white transition-colors ml-4 focus:outline-none">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
