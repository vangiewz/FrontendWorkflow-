import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <!-- Background decorations -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          class="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-700/8 blur-[120px] animate-pulse-glow"
        ></div>
        <div
          class="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[100px] animate-pulse-glow"
          style="animation-delay: 2s"
        ></div>
      </div>

      <!-- Login card -->
      <div class="relative z-10 w-full max-w-md animate-fade-in-up">
        <!-- Logo -->
        <div class="text-center mb-8">
          <a href="/" class="inline-flex items-center gap-3 group" aria-label="Volver al inicio">
            <div
              class="w-12 h-12 rounded-xl bg-purple-700 flex items-center justify-center shadow-lg shadow-purple-700/40 group-hover:shadow-purple-600/50 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </a>
          <h1 class="mt-4 text-2xl font-bold text-white">Iniciar Sesión</h1>
          <p class="mt-2 text-sm text-gray-400">
            Acceso exclusivo para empleados y administradores
          </p>
        </div>

        <!-- Form card -->
        <div class="glass-strong rounded-2xl p-8">
          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6"
          >
            <!-- Email -->
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-300 mb-2"
                >Correo electrónico</label
              >
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="tu@empresa.com"
                class="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none"
                [class.border-red-500]="isFieldInvalid('email')"
              />
              @if (isFieldInvalid('email')) {
                <p class="mt-1.5 text-xs text-red-400" role="alert">
                  @if (loginForm.get('email')?.hasError('required')) {
                    El correo es obligatorio
                  } @else {
                    Ingresa un correo válido
                  }
                </p>
              }
            </div>

            <!-- Password -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-300 mb-2"
                >Contraseña</label
              >
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none pr-12"
                  [class.border-red-500]="isFieldInvalid('password')"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  (click)="togglePassword()"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    @if (showPassword()) {
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    } @else {
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    }
                  </svg>
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <p class="mt-1.5 text-xs text-red-400" role="alert">
                  La contraseña es obligatoria
                </p>
              }
            </div>

            <!-- Error message -->
            @if (errorMessage()) {
              <div
                class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400"
                role="alert"
              >
                {{ errorMessage() }}
              </div>
            }

            <!-- Submit button -->
            <app-button
              variant="primary"
              size="lg"
              type="submit"
              [fullWidth]="true"
              [ariaLabel]="'Iniciar sesión'"
            >
              @if (isLoading()) {
                <svg
                  class="animate-spin w-5 h-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    class="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Ingresando...
              } @else {
                Iniciar Sesión
              }
            </app-button>
          </form>
        </div>

        <!-- Back to landing -->
        <p class="mt-6 text-center text-sm text-gray-500">
          <a
            href="/"
            class="text-purple-400 hover:text-purple-300 transition-colors"
            >← Volver al inicio</a
          >
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        this.authService.saveUser(response);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message =
          err.error?.error || 'Error de conexión. Intenta de nuevo.';
        this.errorMessage.set(message);
      },
    });
  }
}
