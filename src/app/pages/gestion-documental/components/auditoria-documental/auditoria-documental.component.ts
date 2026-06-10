import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UsuarioService, UsuarioResponse } from '../../../../services/usuario.service';
import { AuditoriaService, RegistroAuditoria, AuditoriaFilters } from '../../services/auditoria.service';
import { AuditoriaTimelineComponent } from './components/auditoria-timeline.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-auditoria-documental',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, AuditoriaTimelineComponent, SidebarComponent],
  template: `
    <div class="flex h-screen bg-surface-950 overflow-hidden">
      <!-- Sidebar Desktop -->
      <app-sidebar [isMobile]="false" />

      <!-- Sidebar Mobile Overlay -->
      @if (mobileSidebarOpen()) {
        <div class="fixed inset-0 z-50 lg:hidden" (click)="mobileSidebarOpen.set(false)">
          <div class="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"></div>
          <app-sidebar [isMobile]="true" (closeSidebar)="mobileSidebarOpen.set(false)" />
        </div>
      }

      <div class="flex-1 flex flex-col font-sans text-white h-full overflow-y-auto">
        <div class="p-6 max-w-5xl mx-auto w-full min-h-[80vh]">
          
          <!-- Header -->
          <header class="mb-8 flex items-center gap-4">
            <button class="lg:hidden text-gray-400 hover:text-white p-2" (click)="mobileSidebarOpen.set(true)" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <a routerLink="/paquetes/gestion-documental" class="text-gray-400 hover:text-white sm:mr-4 p-2 rounded-lg hover:bg-surface-800 transition-colors shrink-0" aria-label="Volver atrás">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
            </a>

            <div>
               <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <div class="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 hidden sm:block">
                  <svg class="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Auditoría Documental
              </h1>
              <p class="text-gray-400 mt-2 sm:ml-14 text-sm sm:text-base">Registro inmutable de actividades y trazabilidad de documentos.</p>
            </div>
          </header>

          <!-- Control Panel Superior -->
          <div class="bg-surface-800/80 backdrop-blur-md border border-surface-700 p-6 rounded-2xl shadow-xl mb-4 relative overflow-visible group z-[60]">
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            
                <div class="relative z-[70] flex flex-col md:flex-row md:items-end gap-6">
              <div class="flex-1 relative">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Buscador Predictivo de Usuarios (Actor)</label>
                <div class="relative">
                  <input type="text"
                         [formControl]="searchControl"
                         (keyup.enter)="aplicarFiltroTexto()"
                         placeholder="Escribe el nombre o correo del usuario..."
                         class="w-full bg-surface-900 text-white text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 pl-10 pr-10 py-3 transition-all hover:border-surface-500 shadow-inner outline-none" />
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  @if (searchControl.value && searchControl.value.length > 0) {
                     <button (click)="limpiarBuscador()" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  }
                </div>

                <!-- Dropdown Predictivo -->
                @if (showDropdown && filteredUsuarios.length > 0) {
                   <div class="absolute top-full left-0 right-0 mt-2 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto">
                      <ul class="py-1">
                         @for (usuario of filteredUsuarios; track usuario.id) {
                            <li (click)="seleccionarUsuario(usuario)" class="px-4 py-3 hover:bg-surface-700 cursor-pointer transition-colors border-b border-surface-700/50 last:border-0">
                               <div class="text-sm font-semibold text-gray-200">{{ usuario.nombre }} <span class="text-xs text-purple-400 ml-1">[{{ usuario.rol }}]</span></div>
                               <div class="text-xs text-gray-400">{{ usuario.email }}</div>
                            </li>
                         }
                      </ul>
                   </div>
                }
                @if (showDropdown && searchControl.value && searchControl.value.length >= 2 && filteredUsuarios.length === 0) {
                   <div class="absolute top-full left-0 right-0 mt-2 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-[60] p-4 text-center">
                      <p class="text-sm text-gray-400">No se encontraron usuarios.</p>
                   </div>
                }
              </div>
              
              <div class="shrink-0 flex items-center gap-3">
                 @if (filtros.actorId || filtros.startDate || filtros.endDate || filtros.tipoEvento) {
                    <button (click)="limpiarFiltrosUI()" 
                            class="flex items-center gap-2 bg-surface-700 hover:bg-surface-600 border border-surface-500 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-md">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Ver Todo Global
                    </button>
                 }
              </div>
            </div>
          </div>

          <!-- Filtros UI (Glassmorphism) -->
          <div class="bg-surface-800/60 backdrop-blur-md border border-surface-700/50 p-5 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row items-end gap-4 relative z-10">
            
            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fecha Inicio</label>
              <input type="date" [(ngModel)]="filtros.startDate"
                     class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none" />
            </div>

            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fecha Fin</label>
              <input type="date" [(ngModel)]="filtros.endDate"
                     class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none" />
            </div>

            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Acción / Tipo de Evento</label>
              <select [(ngModel)]="filtros.tipoEvento"
                      class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none appearance-none">
                <option value="">Todos</option>
                <option value="DOCUMENTO_SUBIDO">Documento Subido</option>
                <option value="DOCUMENTO_LEIDO_DESCARGADO">Lectura / Descarga</option>
                <option value="DOCUMENTO_EDITADO_COLABORATIVO">Edición Colaborativa</option>
              </select>
            </div>

            <div class="shrink-0 flex gap-3 w-full md:w-auto">
               <button (click)="limpiarFiltrosUI()" 
                       class="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-surface-700 hover:bg-surface-600 border border-surface-500 transition-colors">
                 Limpiar
               </button>
               <button (click)="aplicarFiltros()" 
                       class="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2">
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                 Aplicar
               </button>
            </div>
          </div>

          <!-- Timeline Area -->
          <div class="bg-surface-800/40 backdrop-blur-sm border border-surface-700/50 rounded-2xl p-6 sm:p-8 min-h-[300px] relative z-0">
            
            @if (isLoading) {
              <div class="flex justify-center mt-12 mb-12">
                <div class="animate-pulse flex flex-col items-center">
                   <div class="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                   <p class="text-sm text-purple-400 mt-4 font-medium tracking-wide">Consultando AWS DynamoDB...</p>
                </div>
              </div>
            }
            
            @if (!isLoading) {
               <div class="flex items-center justify-between mb-8 pb-4 border-b border-surface-700/50">
                  <div class="flex items-center gap-3">
                     <div class="w-2 h-8 rounded-full bg-purple-500"></div>
                     <h2 class="text-xl font-semibold text-white tracking-wide">
                        {{ filtros.actorId ? 'Actividad de: ' + filtros.actorId : 'Última Actividad Global (Máx. 30)' }}
                     </h2>
                  </div>
                  <span class="text-xs font-mono bg-surface-900 px-3 py-1.5 rounded-lg text-gray-400 border border-surface-700 shadow-inner">
                     {{ registros.length }} registros
                  </span>
               </div>
               
               @if (registros.length > 0) {
                 <app-auditoria-timeline [registros]="registros"></app-auditoria-timeline>
               } @else {
                 <div class="flex flex-col items-center justify-center text-center opacity-70 mt-12 mb-12">
                   <div class="p-4 bg-surface-800 rounded-full mb-4 shadow-inner border border-surface-700">
                      <svg class="w-10 h-10 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                   </div>
                   <h3 class="text-lg font-medium text-gray-300">Sin registros encontrados</h3>
                   <p class="text-sm text-gray-500 mt-2 max-w-sm">No existen eventos de auditoría para este criterio de búsqueda.</p>
                 </div>
               }
            }
          </div>

        </div>
      </div>
    </div>
  `
})
export class AuditoriaDocumentalComponent implements OnInit, OnDestroy {
  private readonly usuarioService = inject(UsuarioService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly cdr = inject(ChangeDetectorRef);

  mobileSidebarOpen = signal(false);
  
  usuarios: UsuarioResponse[] = [];
  filteredUsuarios: UsuarioResponse[] = [];
  
  searchControl = new FormControl('');
  showDropdown: boolean = false;
  
  private searchSubscription!: Subscription;

  registros: RegistroAuditoria[] = [];
  isLoading = false;

  filtros: AuditoriaFilters = {
    tipoEvento: ''
  };

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarAuditoria();

    // Buscador predictivo con switchMap y debounce
    this.searchSubscription = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim() === '') {
          this.filteredUsuarios = [];
          this.showDropdown = false;
          if (this.filtros.actorId) {
            this.filtros.actorId = undefined;
            this.cargarAuditoria();
          }
          return of([]);
        }
        
        const lowerTerm = term.toLowerCase();
        const matches = this.usuarios.filter(u => {
          const n = u.nombre ? u.nombre.toLowerCase() : '';
          const e = u.email ? u.email.toLowerCase() : '';
          return n.includes(lowerTerm) || e.includes(lowerTerm);
        });
        return of(matches);
      })
    ).subscribe(matches => {
      const term = this.searchControl.value;
      if (term && term.trim() !== '') {
         this.filteredUsuarios = matches;
         this.showDropdown = true;
      }
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        // Traemos a TODOS los usuarios sin importar su rol
        this.usuarios = usuarios;
      },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  seleccionarUsuario(usuario: UsuarioResponse) {
    this.filtros.actorId = `${usuario.nombre}|${usuario.email}`;
    // Emit event: false para no disparar el valueChanges y evitar un loop
    this.searchControl.setValue(usuario.nombre, { emitEvent: false });
    this.showDropdown = false;
    this.filteredUsuarios = [];
    
    this.cargarAuditoria();
  }

  aplicarFiltroTexto() {
    const text = this.searchControl.value;
    if (text && text.trim() !== '') {
      // Intentar enviar el texto que escribió
      this.filtros.actorId = text.trim();
      this.showDropdown = false;
      this.filteredUsuarios = [];
      this.cargarAuditoria();
    }
  }

  limpiarBuscador() {
    this.filtros.actorId = undefined;
    this.searchControl.setValue('', { emitEvent: true });
  }

  aplicarFiltros() {
    this.cargarAuditoria();
  }

  limpiarFiltrosUI() {
    this.filtros = { tipoEvento: '', startDate: '', endDate: '' };
    this.cargarAuditoria();
  }

  // Método centralizado para recargar la tabla manteniendo contexto
  cargarAuditoria() {
    this.isLoading = true;
    this.registros = [];
    this.cdr.detectChanges();
    
    // Purgar campos vacíos para no enviar params indeseados
    const activeFilters: AuditoriaFilters = {};
    if (this.filtros.startDate) activeFilters.startDate = this.filtros.startDate;
    if (this.filtros.endDate) activeFilters.endDate = this.filtros.endDate;
    if (this.filtros.tipoEvento) activeFilters.tipoEvento = this.filtros.tipoEvento;
    if (this.filtros.actorId) activeFilters.actorId = this.filtros.actorId;

    // Estado: Global Recientes (ahora el buscador solo aplica filtros de actor, no cambia el cliente base)
    this.auditoriaService.obtenerAuditoriaReciente(activeFilters).subscribe({
      next: (data) => {
        this.registros = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching auditoria reciente:', err);
        if (err.error && typeof err.error === 'string') {
           alert("Error Backend: " + err.error);
        } else if (err.message) {
           alert("Error HTTP: " + err.message);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
