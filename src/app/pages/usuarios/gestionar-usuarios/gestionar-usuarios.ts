import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuarioService, UsuarioResponse } from '../../../services/usuario.service';
import { DepartamentoService, Departamento } from '../../../services/departamento.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestionar-usuarios',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-surface-950 flex flex-col font-sans">
      <header class="h-16 border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm flex items-center px-6 shrink-0 z-20">
        <a routerLink="/dashboard" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          <span class="font-medium text-sm">Volver</span>
        </a>
        <div class="h-6 w-px bg-surface-700 mx-4"></div>
        <h1 class="text-xl font-bold text-white tracking-tight flex-1">Gestionar Usuarios</h1>
        <a routerLink="/usuarios/crear" class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Crear Usuario
        </a>
      </header>

      <main class="flex-1 overflow-auto p-4 sm:p-8">
        <div class="max-w-7xl mx-auto">
          @if (errorMessage()) {
            <div class="mb-4 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200">
              {{ errorMessage() }}
            </div>
          }
          @if (successMessage()) {
            <div class="mb-4 p-4 bg-green-900/40 border border-green-500/50 rounded-xl text-green-200">
              {{ successMessage() }}
            </div>
          }

          <div class="bg-surface-900/50 border border-surface-800 rounded-2xl shadow-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-800/80 text-gray-400 text-xs uppercase tracking-wider">
                    <th class="p-4 font-semibold">Usuario</th>
                    <th class="p-4 font-semibold">Estado</th>
                    <th class="p-4 font-semibold">Teléfono</th>
                    <th class="p-4 font-semibold">Rol</th>
                    <th class="p-4 font-semibold">Departamento</th>
                    <th class="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-800">
                  @for (u of usuarios(); track u.id) {
                    <tr class="hover:bg-surface-800/30 transition-colors">
                      <td class="p-4">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-500/30 flex justify-center items-center font-bold text-purple-200 shrink-0">
                            {{ u.nombre.substring(0, 2).toUpperCase() }}
                          </div>
                          <div>
                            <p class="text-white font-medium text-sm">{{ u.nombre }}</p>
                            <p class="text-gray-500 text-xs">{{ u.email }} | ID: {{ u.id }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="p-4">
                        @if (u.isActive) {
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
                        } @else {
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Inactivo</span>
                        }
                      </td>
                      <td class="p-4">
                        <div class="flex flex-col">
                           <span class="text-sm text-gray-300" *ngIf="u.telefono">{{ u.telefono }}</span>
                           <span class="text-sm text-gray-500 italic" *ngIf="!u.telefono">Sin registrar</span>
                           <button class="text-xs text-purple-400 hover:text-purple-300 w-max" (click)="changeTelefono(u.id, u.telefono)" [disabled]="!u.isActive">Cambiar</button>
                        </div>
                      </td>
                      <td class="p-4">
                        <select 
                          [ngModel]="u.rol" 
                          (ngModelChange)="changeRol(u.id, $event)"
                          [disabled]="!u.isActive"
                          class="bg-surface-800 border border-surface-700 text-gray-300 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2 outline-none disabled:opacity-50"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="FUNCIONARIO">FUNCIONARIO</option>
                        </select>
                      </td>
                      <td class="p-4">
                        <select 
                          [ngModel]="u.departamentoId" 
                          (ngModelChange)="changeDepto(u.id, $event)"
                          [disabled]="!u.isActive"
                          class="bg-surface-800 border border-surface-700 text-gray-300 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2 outline-none min-w-[150px] disabled:opacity-50"
                        >
                          <option [value]="null">-- Sin Depto --</option>
                          @for (d of departamentos(); track d.id) {
                            <option [value]="d.id">{{ d.nombre }}</option>
                          }
                        </select>
                      </td>
                      <td class="p-4 text-right whitespace-nowrap">
                        <button 
                          (click)="changePassword(u.id)"
                          [disabled]="!u.isActive"
                          class="mr-2 p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent" 
                          title="Cambiar Contraseña"
                        >
                          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                        @if (u.isActive) {
                          <button 
                            (click)="desactivarUsuario(u.id, u.nombre)"
                            class="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                            title="Desactivar Usuario"
                          >
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          </button>
                        } @else {
                          <button 
                            (click)="reactivarUsuario(u.id, u.nombre)"
                            class="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" 
                            title="Activar Usuario"
                          >
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="p-8 text-center text-gray-500 text-sm">
                        No hay usuarios listados.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class GestionarUsuariosPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly departamentoService = inject(DepartamentoService);

  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly departamentos = signal<Departamento[]>([]);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.departamentoService.getDepartamentos().subscribe((d) => this.departamentos.set(d));
    this.usuarioService.getUsuarios().subscribe((u) => Object.freeze(this.usuarios.set(u)));
  }

  changeRol(id: string, newRol: string) {
    this.usuarioService.updateRol(id, newRol).subscribe({
      next: (res) => {
        this.usuarios.update(us => us.map(u => u.id === id ? res : u));
        this.mostrarExito('Rol actualizado correctamente');
      },
      error: (e) => this.mostrarError(e.error?.error || 'Error al cambiar rol')
    });
  }

  changeDepto(id: string, newDeptoId: string | null) {
    if (!newDeptoId || newDeptoId === 'null') {
        this.mostrarError('No se puede dejar sin departamento con este payload por ahora');
        return;
    }
    this.usuarioService.assignDepartamento(id, newDeptoId).subscribe({
      next: (res) => {
        this.usuarios.update(us => us.map(u => u.id === id ? res : u));
        this.mostrarExito('Departamento asignado correctamente');
      },
      error: (e) => this.mostrarError(e.error?.error || 'Error asignando departamento')
    });
  }

  changeTelefono(id: string, currently: string | undefined) {
    const p = prompt('Ingrese el nuevo teléfono. Déjelo vacío para eliminar.', currently || '');
    if (p === null) return;
    this.usuarioService.updateTelefono(id, p).subscribe({
      next: (res) => {
        this.usuarios.update(us => us.map(u => u.id === id ? res : u));
        this.mostrarExito('Teléfono actualizado correctamente');
      },
      error: (e) => this.mostrarError(e.error?.error || 'Error actualizando teléfono')
    });
  }

  changePassword(id: string) {
    const pwd = prompt('Ingrese la nueva contraseña para este usuario (mínimo 6 caracteres):');
    if (!pwd) return;
    if (pwd.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.usuarioService.adminChangePassword(id, pwd).subscribe({
      next: (res) => this.mostrarExito(res.message),
      error: (e) => this.mostrarError(e.error?.error || 'Error al cambiar la contraseña')
    });
  }

  desactivarUsuario(id: string, nombre: string) {
    if (!confirm(`¿Desactivar a ${nombre}?\nYa no listará dentro de este sistema, ni podrá acceder.`)) return;

    this.usuarioService.deleteUsuario(id).subscribe({
      next: (res) => {
        this.mostrarExito(res.message);
        // Actualizar visualmente la tabla
        this.usuarios.update(us => us.map(u => u.id === id ? { ...u, isActive: false } : u));
      },
      error: (e) => this.mostrarError(e.error?.error || 'Error al desactivar')
    });
  }

  reactivarUsuario(id: string, nombre: string) {
    if (!confirm(`¿Reactivar a ${nombre}?\nVolverá a tener acceso completo.`)) return;

    this.usuarioService.reactivateUsuario(id).subscribe({
      next: (res) => {
        this.mostrarExito(res.message);
        this.usuarios.update(us => us.map(u => u.id === id ? { ...u, isActive: true } : u));
      },
      error: (e) => this.mostrarError(e.error?.error || 'Error al reactivar')
    });
  }

  private mostrarExito(msg: string) {
    this.successMessage.set(msg);
    this.errorMessage.set(null);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  private mostrarError(msg: string) {
    this.errorMessage.set(msg);
    this.successMessage.set(null);
  }
}
