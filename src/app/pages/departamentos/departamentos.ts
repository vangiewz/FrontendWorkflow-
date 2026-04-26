import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { DepartamentoService, Departamento } from '../../services/departamento.service';
import { ButtonComponent } from '../../shared/button/button';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { DialogService } from '../../shared/dialog/dialog.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, RouterLink, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Toggle switch */
    .switch {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 40px;
      height: 22px;
      cursor: pointer;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      inset: 0;
      background-color: rgba(100, 100, 120, 0.5);
      border-radius: 999px;
      transition: background-color 0.3s ease;
    }
    .slider::before {
      content: '';
      position: absolute;
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.3s ease;
    }
    input:checked + .slider {
      background-color: #10b981;
    }
    input:checked + .slider::before {
      transform: translateX(18px);
    }
  `],
  template: `
    <div class="min-h-screen flex bg-surface-950 font-sans">
      <app-sidebar [isMobile]="false" />

      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top bar -->
        <header class="h-16 border-b border-purple-900/20 bg-surface-900/50 backdrop-blur-sm flex items-center px-4 sm:px-6 shrink-0 z-10 sticky top-0">
          <button class="lg:hidden text-gray-400 hover:text-white p-2 mr-3" (click)="toggleMobileSidebar()" aria-label="Abrir menú">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h2 class="text-lg font-semibold text-white tracking-wide truncate">Gestión de Departamentos</h2>
        </header>

        <!-- Mobile sidebar overlay -->
        @if (mobileSidebarOpen()) {
          <div class="fixed inset-0 z-50 lg:hidden" (click)="toggleMobileSidebar()">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <app-sidebar [isMobile]="true" (closeSidebar)="toggleMobileSidebar()" />
          </div>
        }

        <!-- Content -->
        <main class="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
          <div class="max-w-5xl mx-auto">
            <!-- Page Header -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
              <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-white mb-1">Departamentos</h1>
                <p class="text-gray-400 text-sm">Gestión de áreas organizacionales.</p>
              </div>
              <a routerLink="/paquetes/admin-organizacional" class="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Volver
              </a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <!-- Create Form -->
              <div class="lg:col-span-1">
                <div class="glass relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-white/10 bg-surface-900/40 backdrop-blur-md">
                  <div class="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none"></div>

                  <h2 class="text-lg sm:text-xl font-semibold text-white mb-4 relative z-10 flex items-center gap-2">
                    <span class="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </span>
                    Nuevo
                  </h2>

                  <form [formGroup]="departamentoForm" (ngSubmit)="onSubmit()" class="relative z-10 flex flex-col gap-4">
                    <div>
                      <label for="nombre" class="block text-sm font-medium text-gray-300 mb-1">Nombre del Departamento</label>
                      <input
                        id="nombre"
                        type="text"
                        formControlName="nombre"
                        class="block w-full px-4 py-3 bg-surface-800 border border-surface-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                        placeholder="Ej. Recursos Humanos"
                      />
                      @if (departamentoForm.get('nombre')?.invalid && departamentoForm.get('nombre')?.touched) {
                        <p class="mt-1 text-sm text-red-500">El nombre es requerido.</p>
                      }
                    </div>

                    @if (errorMessage()) {
                      <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {{ errorMessage() }}
                      </div>
                    }

                    @if (successMessage()) {
                      <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                        {{ successMessage() }}
                      </div>
                    }

                    <app-button
                      type="submit"
                      variant="primary"
                      class="w-full mt-2"
                      [disabled]="departamentoForm.invalid || isLoading()"
                    >
                      @if (isLoading()) {
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Añadiendo...
                      } @else {
                        Crear Departamento
                      }
                    </app-button>
                  </form>
                </div>
              </div>

              <!-- List -->
              <div class="lg:col-span-2">
                <div class="glass relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-white/10 bg-surface-900/40 backdrop-blur-md h-full min-h-[300px] sm:min-h-[400px]">

                  <h2 class="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span class="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                    </span>
                    Listado
                  </h2>

                  @if (isLoadingList()) {
                    <div class="flex flex-col items-center justify-center p-12 space-y-4">
                      <svg class="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <p class="text-gray-400 font-medium animate-pulse">Cargando departamentos...</p>
                    </div>
                  } @else {
                    <div class="space-y-3">
                      @for (dept of departamentos(); track dept.id) {
                        <div
                          class="group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300"
                          [class.bg-surface-800/50]="dept.isActive"
                          [class.border-surface-600/50]="dept.isActive"
                          [class.hover:bg-surface-800]="dept.isActive"
                          [class.hover:border-purple-500/50]="dept.isActive"
                          [class.bg-surface-800/25]="!dept.isActive"
                          [class.border-surface-700/30]="!dept.isActive"
                          [class.opacity-60]="!dept.isActive"
                        >
                          <!-- Top row: info + switch -->
                          <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3 min-w-0 flex-1">
                              <div class="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center border border-white/5 shadow-inner group-hover:border-purple-500/30 transition-colors">
                                <span class="text-sm font-bold text-gray-300 group-hover:text-white">{{ dept.nombre.substring(0, 2).toUpperCase() }}</span>
                              </div>
                              <div class="min-w-0 flex-1">
                                @if (editingId() === dept.id) {
                                  <input
                                    type="text"
                                    [value]="editName()"
                                    (input)="onEditNameChange($event)"
                                    class="bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-purple-500 text-sm w-full max-w-[200px]"
                                    (keyup.enter)="saveEdit(dept.id)"
                                  />
                                } @else {
                                  <p class="text-white font-medium truncate text-sm sm:text-base">{{ dept.nombre }}</p>
                                  <p class="text-xs text-gray-500 truncate hidden sm:block">ID: {{ dept.id }}</p>
                                }
                              </div>
                            </div>

                            <!-- Switch toggle -->
                            <label class="switch shrink-0" [title]="dept.isActive ? 'Desactivar departamento' : 'Activar departamento'">
                              <input
                                type="checkbox"
                                [checked]="dept.isActive"
                                (change)="toggleDepartamento(dept.id)"
                              />
                              <span class="slider"></span>
                            </label>
                          </div>

                          <!-- Bottom row: status + actions -->
                          <div class="flex items-center justify-between gap-2">
                            <span
                              class="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                              [class.bg-emerald-500/15]="dept.isActive"
                              [class.text-emerald-400]="dept.isActive"
                              [class.border-emerald-500/30]="dept.isActive"
                              [class.bg-amber-500/15]="!dept.isActive"
                              [class.text-amber-400]="!dept.isActive"
                              [class.border-amber-500/30]="!dept.isActive"
                            >{{ dept.isActive ? 'ACTIVO' : 'INACTIVO' }}</span>

                            <div class="flex items-center gap-1">
                              @if (editingId() === dept.id) {
                                <button (click)="saveEdit(dept.id)" class="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Guardar">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                </button>
                                <button (click)="cancelEdit()" class="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors" title="Cancelar">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              } @else {
                                <button (click)="startEdit(dept)" class="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Editar nombre">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button (click)="deleteDepartamento(dept.id, dept.nombre)" class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Eliminar permanentemente">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                              }
                            </div>
                          </div>
                        </div>
                      } @empty {
                        <div class="text-center py-10 px-4 rounded-xl bg-surface-800/30 border border-surface-700 border-dashed">
                          <span class="text-4xl block mb-3">🏢</span>
                          <p class="text-gray-400 font-medium">No hay departamentos todavía.</p>
                          <p class="text-sm text-gray-500 mt-1">Usa el formulario para crear el primero.</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class DepartamentosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly toast = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  readonly departamentoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
  });

  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly isLoadingList = signal(true);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly editingId = signal<string | null>(null);
  protected readonly editName = signal<string>('');

  protected readonly mobileSidebarOpen = signal(false);

  ngOnInit(): void {
    this.cargarDepartamentos();
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  cargarDepartamentos(): void {
    this.isLoadingList.set(true);
    this.departamentoService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos.set(data);
        this.isLoadingList.set(false);
      },
      error: (err) => {
        console.error('Error al cargar departamentos', err);
        this.isLoadingList.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.departamentoForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const query = { nombre: this.departamentoForm.value.nombre! };

    this.departamentoService.createDepartamento(query).subscribe({
      next: (dept) => {
        this.successMessage.set(`Departamento '${dept.nombre}' creado.`);
        this.departamentoForm.reset();
        this.departamentos.update(depts => [...depts, dept]);
        this.isLoading.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Error al crear departamento');
        this.isLoading.set(false);
      }
    });
  }

  startEdit(dept: Departamento): void {
    this.editingId.set(dept.id);
    this.editName.set(dept.nombre);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editName.set('');
  }

  onEditNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.editName.set(value);
  }

  saveEdit(id: string): void {
    const newName = this.editName().trim();
    if (!newName) return;

    this.departamentoService.updateDepartamento(id, { nombre: newName }).subscribe({
      next: (updatedDept) => {
        this.departamentos.update(depts => depts.map(d => d.id === id ? updatedDept : d));
        this.cancelEdit();
        this.toast.success(`Departamento actualizado correctamente.`);
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Error al actualizar departamento');
      }
    });
  }

  toggleDepartamento(id: string): void {
    // Optimistic update: toggle immediately in UI
    this.departamentos.update(depts =>
      depts.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d)
    );

    this.departamentoService.toggleActive(id).subscribe({
      next: (updated) => {
        // Sync with actual server response
        this.departamentos.update(depts => depts.map(d => d.id === id ? updated : d));
        const estado = updated.isActive ? 'activado' : 'desactivado';
        this.toast.success(`Departamento ${updated.nombre} ${estado}.`);
      },
      error: (err) => {
        // Revert optimistic update
        this.departamentos.update(depts =>
          depts.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d)
        );
        this.toast.error(err.error?.error || 'Error al cambiar el estado del departamento');
      }
    });
  }

  deleteDepartamento(id: string, nombre: string): void {
    this.dialogService.confirm(
      'Eliminar Departamento',
      `¿Estás seguro de que deseas eliminar permanentemente el departamento '${nombre}'?\n¡Esta acción no se puede deshacer!`,
      true,
      'Eliminar'
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.departamentoService.deleteDepartamento(id).subscribe({
        next: () => {
          this.departamentos.update(depts => depts.filter(d => d.id !== id));
          this.toast.success(`Departamento eliminado correctamente.`);
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Error al eliminar departamento (¿Aún tiene usuarios asignados?)');
        }
      });
    });
  }
}
