import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuarioService, UsuarioResponse } from '../../../services/usuario.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/toast/toast.service';
import { DialogService } from '../../../shared/dialog/dialog.service';

@Component({
  selector: 'app-gestionar-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-surface-950 flex flex-col font-sans">
      <header class="min-h-[4rem] py-2 sm:py-0 border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm flex flex-wrap items-center justify-between px-4 sm:px-6 shrink-0 z-20 gap-2">
        <div class="flex items-center gap-2 sm:gap-4">
          <a routerLink="/dashboard" class="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span class="font-medium text-sm hidden sm:block">Volver</span>
          </a>
          <div class="h-6 w-px bg-surface-700 hidden sm:block"></div>
          <h1 class="text-lg sm:text-xl font-bold text-white tracking-tight">Gestionar Clientes</h1>
        </div>
        <a routerLink="/usuarios/crear" class="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span class="hidden sm:inline">Crear Cliente</span>
          <span class="sm:hidden">Crear</span>
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
                    <th class="p-4 font-semibold">Cliente</th>
                    <th class="p-4 font-semibold">Estado</th>
                    <th class="p-4 font-semibold">Teléfono</th>
                    <th class="p-4 font-semibold">Rol</th>
                    <th class="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-800">
                  @for (u of clientes(); track u.id) {
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
                          [ngModel]="(u.rol || '').trim().toUpperCase()" 
                          (ngModelChange)="changeRol(u.id, $event)"
                          [disabled]="!u.isActive"
                          class="bg-surface-800 border border-surface-700 text-gray-300 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2 outline-none disabled:opacity-50"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="FUNCIONARIO">FUNCIONARIO</option>
                          <option value="CLIENTE">CLIENTE</option>
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
                            title="Desactivar Cliente"
                          >
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          </button>
                        } @else {
                          <button 
                            (click)="reactivarUsuario(u.id, u.nombre)"
                            class="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" 
                            title="Activar Cliente"
                          >
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="p-8 text-center text-gray-500 text-sm">
                        No hay clientes listados.
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
export class GestionarClientesPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  readonly usuarios = signal<UsuarioResponse[]>([]);
  
  // Filtrar solo los de rol CLIENTE (robusto a espacios/mayúsculas)
  readonly clientes = computed(() => this.usuarios().filter(u => u.rol && u.rol.trim().toUpperCase() === 'CLIENTE'));

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.usuarioService.getUsuarios().subscribe((u) => Object.freeze(this.usuarios.set(u)));
  }

  changeRol(id: string, newRol: string) {
    this.usuarioService.updateRol(id, newRol).subscribe({
      next: (res) => {
        this.usuarios.update(us => us.map(u => u.id === id ? res : u));
        this.mostrarExito('Rol actualizado correctamente. El usuario se moverá al grupo correspondiente.');
      },
      error: (e) => this.mostrarError(e.error?.error || 'Error al cambiar rol')
    });
  }

  changeTelefono(id: string, currently: string | undefined) {
    this.dialogService.prompt('Cambiar Teléfono', 'Ingrese el nuevo teléfono. Déjelo vacío para eliminar.', currently || '').subscribe(p => {
      if (p === null) return;
      this.usuarioService.updateTelefono(id, p).subscribe({
        next: (res) => {
          this.usuarios.update(us => us.map(u => u.id === id ? res : u));
          this.mostrarExito('Teléfono actualizado correctamente');
        },
        error: (e) => this.mostrarError(e.error?.error || 'Error actualizando teléfono')
      });
    });
  }

  changePassword(id: string) {
    this.dialogService.prompt('Cambiar Contraseña', 'Ingrese la nueva contraseña para este cliente (mínimo 6 caracteres):').subscribe(pwd => {
      if (pwd === null) return;
      if (!pwd || pwd.length < 6) {
        this.toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
  
      this.usuarioService.adminChangePassword(id, pwd).subscribe({
        next: (res) => this.toast.success(res.message),
        error: (e) => this.toast.error(e.error?.error || 'Error al cambiar la contraseña')
      });
    });
  }

  desactivarUsuario(id: string, nombre: string) {
    this.dialogService.confirm(
      'Desactivar Cliente',
      `¿Desactivar a ${nombre}?\nYa no listará dentro de este sistema, ni podrá acceder.`,
      true,
      'Desactivar'
    ).subscribe(confirmed => {
      if (!confirmed) return;
  
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          this.toast.success('Cliente desactivado correctamente');
          this.usuarios.update(us => us.map(u => u.id === id ? { ...u, isActive: false } : u));
        },
        error: () => this.toast.error('Error al desactivar el cliente')
      });
    });
  }

  reactivarUsuario(id: string, nombre: string) {
    this.dialogService.confirm(
      'Reactivar Cliente',
      `¿Reactivar a ${nombre}?\nVolverá a tener acceso completo.`,
      false,
      'Reactivar'
    ).subscribe(confirmed => {
      if (!confirmed) return;
  
      this.usuarioService.reactivateUsuario(id).subscribe({
        next: () => {
          this.toast.success('Cliente reactivado correctamente');
          this.usuarios.update(us => us.map(u => u.id === id ? { ...u, isActive: true } : u));
        },
        error: () => this.toast.error('Error al reactivar el cliente')
      });
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
