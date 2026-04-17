import {
  Component,
  ChangeDetectionStrategy,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      (click)="closeModal.emit()"
    >
      <div
        class="bg-surface-900 border border-purple-900/30 rounded-2xl shadow-2xl shadow-purple-900/20 max-w-md w-full p-6 animate-slide-up"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white">Cambiar Contraseña</h2>
          <button
            class="text-gray-400 hover:text-white transition-colors"
            (click)="closeModal.emit()"
            aria-label="Cerrar modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          <!-- Current Password -->
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-300 mb-1">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              type="password"
              formControlName="currentPassword"
              class="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="••••••••"
            />
            @if (form.controls['currentPassword'].touched && form.controls['currentPassword'].hasError('required')) {
              <p class="text-red-400 text-xs mt-1">Este campo es obligatorio.</p>
            }
          </div>

          <!-- New Password -->
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-300 mb-1">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              class="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="••••••••"
            />
            @if (form.controls['newPassword'].touched && form.controls['newPassword'].hasError('required')) {
              <p class="text-red-400 text-xs mt-1">Este campo es obligatorio.</p>
            } @else if (form.controls['newPassword'].touched && form.controls['newPassword'].hasError('minlength')) {
              <p class="text-red-400 text-xs mt-1">Debe tener al menos 6 caracteres.</p>
            }
          </div>

          <!-- Confirm New Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="••••••••"
            />
            @if (form.controls['confirmPassword'].touched && form.errors?.['passwordMismatch']) {
              <p class="text-red-400 text-xs mt-1">Las contraseñas no coinciden.</p>
            }
          </div>

          <!-- Alerts -->
          @if (errorMessage()) {
            <div class="p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {{ errorMessage() }}
            </div>
          }
          @if (successMessage()) {
            <div class="p-3 bg-green-900/40 border border-green-500/50 rounded-lg text-green-200 text-sm">
              {{ successMessage() }}
            </div>
          }

          <!-- Actions -->
          <div class="flex justify-end gap-3 mt-4">
            <app-button
              type="button"
              variant="ghost"
              (click)="closeModal.emit()"
              [disabled]="isLoading()"
            >
              Cancelar
            </app-button>
            <app-button
              type="submit"
              variant="primary"
              [disabled]="form.invalid || isLoading()"
            >
              {{ isLoading() ? 'Guardando...' : 'Cambiar Contraseña' }}
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordModalComponent {
  closeModal = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const request = {
      currentPassword: this.form.value.currentPassword!,
      newPassword: this.form.value.newPassword!,
    };

    this.usuarioService.changePassword(request).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message);
        this.form.reset();
        setTimeout(() => {
          this.closeModal.emit();
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Ocurrió un error inesperado');
      },
    });
  }
}
