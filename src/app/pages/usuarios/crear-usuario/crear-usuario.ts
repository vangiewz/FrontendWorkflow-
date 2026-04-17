import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { DepartamentoService, Departamento } from '../../../services/departamento.service';
import { ButtonComponent } from '../../../shared/button/button';
import { RouterLink } from '@angular/router';
// @ts-ignore
import * as generator from 'generate-password-browser';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-surface-950 flex flex-col font-sans">
      <header class="h-16 border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm flex items-center px-6 shrink-0 z-20">
        <a routerLink="/usuarios" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          <span class="font-medium text-sm">Volver a Usuarios</span>
        </a>
        <div class="h-6 w-px bg-surface-700 mx-4"></div>
        <h1 class="text-xl font-bold text-white tracking-tight">Crear Nuevo Usuario</h1>
      </header>

      <main class="flex-1 flex overflow-y-auto p-6 justify-center items-start">
        <div class="w-full max-w-xl bg-surface-900/50 rounded-2xl border border-surface-800/80 mt-10 p-8 shadow-xl shadow-black/50">
          
          <h2 class="text-2xl font-bold text-white mb-2">Datos del Empleado</h2>
          <p class="text-gray-400 text-sm mb-6">Completa la información necesaria para registrar a un nuevo integrante del equipo. Se encriptará de forma segura.</p>

          <form [formGroup]="userForm" (ngSubmit)="onCreate()" class="space-y-5">
            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-300">Correo Electrónico</label>
              <input 
                type="email" 
                formControlName="email"
                placeholder="ejemplo@empresa.com"
                class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
                <span class="text-xs text-red-400 mt-1">El email es requerido y debe ser válido.</span>
              }
            </div>

            <!-- Nombre -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-300">Nombre Completo</label>
              <input 
                type="text" 
                formControlName="nombre"
                placeholder="Ej. Juan Pérez"
                class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            <!-- Teléfono -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-300">Teléfono (Opcional)</label>
              <input 
                type="text" 
                formControlName="telefono"
                placeholder="Ej. +1 234 567 8900"
                class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            <!-- Contraseña -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-300">Contraseña (Mínimo 6 caracteres)</label>
              <div class="flex gap-2">
                <input 
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Escribe o genera una contraseña..."
                  class="flex-1 bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-gray-100 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                />
                <button type="button" (click)="togglePassword()" class="px-3 bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded-xl text-gray-400 transition-colors">
                  <svg *ngIf="!showPassword()" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg *ngIf="showPassword()" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
                <app-button type="button" variant="outline" (click)="generatePassword()">Generar Vía IA</app-button>
              </div>
            </div>

            <!-- Rol -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-300">Rol del Sistema</label>
              <select formControlName="rol" class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-gray-100 outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none">
                <option value="FUNCIONARIO">Funcionario</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <!-- Departamento -->
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-gray-300">Departamento Asignado</label>
              <select formControlName="departamentoId" class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-gray-100 outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none">
                <option value="" disabled selected>-- Selecciona un Departamento (Opcional) --</option>
                @for (d of departamentos(); track d.id) {
                  <option [value]="d.id">{{ d.nombre }}</option>
                }
              </select>
            </div>

            <div class="h-px w-full bg-surface-800 my-4"></div>

            <!-- Acciones -->
            <div class="flex justify-end gap-3 pt-2">
              <app-button type="button" variant="outline" routerLink="/usuarios">Cancelar</app-button>
              <app-button type="submit" variant="primary" [disabled]="userForm.invalid || isSubmitting()">
                {{ isSubmitting() ? 'Creando...' : 'Crear Usuario' }}
              </app-button>
            </div>
            
            @if (errorMessage()) {
              <div class="p-3 mt-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                {{ errorMessage() }}
              </div>
            }

          </form>
        </div>
      </main>
    </div>
  `
})
export class CrearUsuarioPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deptoService = inject(DepartamentoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  departamentos = signal<Departamento[]>([]);
  showPassword = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', Validators.required],
    telefono: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['FUNCIONARIO', Validators.required],
    departamentoId: ['']
  });

  ngOnInit() {
    this.deptoService.getDepartamentos().subscribe((data) => {
      this.departamentos.set(data);
    });
  }

  togglePassword() {
    this.showPassword.update(s => !s);
  }

  generatePassword() {
    const pwd = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      excludeSimilarCharacters: true,
      strict: true
    });
    this.userForm.patchValue({ password: pwd });
    this.showPassword.set(true); // Mostrar contraseña recién generada
  }

  onCreate() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.userForm.value as any;
    // Si envían string vacío para departamento, lo quitamos para no fallar constraints si no lo pide
    if (!payload.departamentoId) {
      payload.departamentoId = undefined;
    }

    this.usuarioService.createUsuario(payload).subscribe({
      next: () => {
        alert("Usuario creado exitosamente!");
        this.router.navigate(['/usuarios']);
      },
      error: (e) => {
        console.error(e);
        this.errorMessage.set(e.error?.error || "Error al crear el usuario. Verifica los datos.");
        this.isSubmitting.set(false);
      }
    });
  }
}
