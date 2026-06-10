import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GestionDocumentalService, DocumentoGestionDTO } from './gestion-documental.service';
import { GestionDocumentalListaComponent } from './components/gestion-documental-lista.component';
import { VisorDocumentoModalComponent } from '../tramites/detalle/components/visor-documento-modal.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gestion-documental-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GestionDocumentalListaComponent, VisorDocumentoModalComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <div class="p-6">
          <!-- Header del Módulo -->
          <header class="mb-8 flex items-center gap-4">
            <button class="lg:hidden text-gray-400 hover:text-white p-2" (click)="mobileSidebarOpen.set(true)" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold tracking-tight">Gestión Documental</h1>
              <p class="text-sm text-gray-400 mt-1">Explora y gestiona los documentos asociados a tu departamento.</p>
            </div>
          </header>

          <!-- Filtros UI (Glassmorphism) -->
          <div class="bg-surface-800/60 backdrop-blur-md border border-surface-700/50 p-5 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row items-end gap-4 relative z-10">
            
            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fecha Inicio (Trámite)</label>
              <input type="date" [(ngModel)]="filtros.startDate"
                     class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none" />
            </div>

            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fecha Fin (Trámite)</label>
              <input type="date" [(ngModel)]="filtros.endDate"
                     class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none" />
            </div>

            <div class="flex-1 w-full relative">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trámite</label>
              <div class="relative">
                <input type="text" [formControl]="tramiteControl" placeholder="Buscar por trámite..."
                       (focus)="showTramiteDropdown.set(true)"
                       class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none" />
                @if (tramiteControl.value && tramiteControl.value.length > 0) {
                   <button (click)="limpiarTramite()" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                }
              </div>
              @if (showTramiteDropdown() && filteredTramites().length > 0) {
                 <div class="absolute top-full left-0 right-0 mt-2 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto">
                    <ul class="py-1">
                       @for (tramite of filteredTramites(); track tramite) {
                          <li (click)="seleccionarTramite(tramite)" class="px-4 py-3 hover:bg-surface-700 cursor-pointer transition-colors border-b border-surface-700/50 last:border-0">
                             <div class="text-sm font-semibold text-gray-200">{{ tramite }}</div>
                          </li>
                       }
                    </ul>
                 </div>
              }
            </div>

            <div class="flex-1 w-full relative">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente / Correo</label>
              <div class="relative">
                <input type="text" [formControl]="clienteControl" placeholder="Buscar por cliente..."
                       (focus)="showClienteDropdown.set(true)"
                       class="w-full bg-surface-900/80 text-gray-300 text-sm rounded-xl border border-surface-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 px-4 py-2.5 transition-all outline-none" />
                @if (clienteControl.value && clienteControl.value.length > 0) {
                   <button (click)="limpiarCliente()" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                }
              </div>
              @if (showClienteDropdown() && filteredClientes().length > 0) {
                 <div class="absolute top-full left-0 right-0 mt-2 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto">
                    <ul class="py-1">
                       @for (cliente of filteredClientes(); track cliente.id) {
                          <li (click)="seleccionarCliente(cliente)" class="px-4 py-3 hover:bg-surface-700 cursor-pointer transition-colors border-b border-surface-700/50 last:border-0">
                             <div class="text-sm font-semibold text-gray-200">{{ cliente.nombre }}</div>
                             <div class="text-xs text-gray-400">{{ cliente.email }}</div>
                          </li>
                       }
                    </ul>
                 </div>
              }
            </div>

            <div class="shrink-0 flex gap-3 w-full md:w-auto">
               <button (click)="limpiarFiltros()" 
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

          <!-- Tarjetas de Navegación (Tabs) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            
            <!-- Tarjeta Pendientes/Activos -->
            <div (click)="setTipo('PENDIENTES')"
                 class="relative overflow-hidden p-6 rounded-2xl border cursor-pointer transition-all duration-300 group"
                 [ngClass]="tipoActivo() === 'PENDIENTES' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-surface-900 border-surface-800 hover:border-surface-700'">
              <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                     [ngClass]="tipoActivo() === 'PENDIENTES' ? 'bg-purple-500 text-white' : 'bg-surface-800 text-gray-400 group-hover:text-white'">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold" [ngClass]="tipoActivo() === 'PENDIENTES' ? 'text-purple-400' : 'text-white'">
                    Documentos Pendientes
                  </h2>
                  <p class="text-sm text-gray-400">Requieren de tu acción en pasos activos.</p>
                </div>
              </div>
            </div>

            <!-- Tarjeta Histórico -->
            <div (click)="setTipo('HISTORICO')"
                 class="relative overflow-hidden p-6 rounded-2xl border cursor-pointer transition-all duration-300 group"
                 [ngClass]="tipoActivo() === 'HISTORICO' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-surface-900 border-surface-800 hover:border-surface-700'">
              <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                     [ngClass]="tipoActivo() === 'HISTORICO' ? 'bg-purple-500 text-white' : 'bg-surface-800 text-gray-400 group-hover:text-white'">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold" [ngClass]="tipoActivo() === 'HISTORICO' ? 'text-purple-400' : 'text-white'">
                    Histórico de Documentos
                  </h2>
                  <p class="text-sm text-gray-400">Documentos de pasos ya completados.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Presentation Component: Lista de Documentos -->
          @if (isLoading()) {
            <div class="flex-1 flex items-center justify-center">
              <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else {
            <app-gestion-documental-lista 
              [documentos]="documentos()"
              (verDocumento)="abrirDocumento($event)"
              (recargar)="cargarDatos()">
            </app-gestion-documental-lista>
          }

          <!-- Modal Inmersivo (Visor/Editor) -->
          @if (docSeleccionado()) {
            <app-visor-documento-modal
              [isOpen]="true"
              [tramiteId]="docSeleccionado()!.tramiteId"
              [campoConfig]="{ type: (docSeleccionado()!.esColaborativo !== false && (docSeleccionado()!.extension === 'WORD' || docSeleccionado()!.extension === 'EXCEL')) ? 'DOCUMENTO_COLABORATIVO' : 'ARCHIVO_ESTATICO', format: docSeleccionado()!.extension }"
              [archivoMetadata]="crearMetadataMock(docSeleccionado()!)"
              [formato]="docSeleccionado()!.extension"
              [rolUsuario]="user()?.rol || ''"
              [departamentoUsuario]="user()?.departamentoId || ''"
              [isReadOnly]="!docSeleccionado()!.editable"
              (close)="cerrarModal()">
            </app-visor-documento-modal>
          }
        </div>
      </div>
    </div>
  `
})
export class GestionDocumentalDashboardComponent implements OnInit, OnDestroy {
  private readonly gestionService = inject(GestionDocumentalService);
  private readonly authService = inject(AuthService);

  user = signal<any>(null);
  mobileSidebarOpen = signal(false);
  tipoActivo = signal<'PENDIENTES' | 'HISTORICO'>('PENDIENTES');
  documentosGlobal = signal<DocumentoGestionDTO[]>([]);
  documentos = signal<DocumentoGestionDTO[]>([]);
  isLoading = signal<boolean>(false);
  docSeleccionado = signal<DocumentoGestionDTO | null>(null);

  filtros = {
    startDate: '',
    endDate: '',
    tramiteName: '',
    clienteBusqueda: ''
  };

  // Predictive search controls
  tramiteControl = new FormControl('');
  clienteControl = new FormControl('');
  
  filteredTramites = signal<string[]>([]);
  filteredClientes = signal<{id: string, nombre: string, email: string}[]>([]);
  
  showTramiteDropdown = signal(false);
  showClienteDropdown = signal(false);

  private sub = new Subscription();

  ngOnInit(): void {
    this.user.set(this.authService.getUser());
    this.cargarDatos();

    this.sub.add(
      this.tramiteControl.valueChanges.pipe(
        debounceTime(200),
        distinctUntilChanged()
      ).subscribe(val => {
        if (val && val.length >= 2) {
          const search = val.toLowerCase();
          const uniqueTramites = Array.from(new Set(
            this.documentosGlobal()
              .map(d => d.tramiteNombre)
              .filter(t => t && t.toLowerCase().includes(search))
          ));
          this.filteredTramites.set(uniqueTramites);
          this.showTramiteDropdown.set(true);
        } else {
          this.filteredTramites.set([]);
          this.showTramiteDropdown.set(false);
          // Auto apply filter when cleared
          if (!val) {
            this.filtros.tramiteName = '';
            this.aplicarFiltros();
          }
        }
      })
    );

    this.sub.add(
      this.clienteControl.valueChanges.pipe(
        debounceTime(200),
        distinctUntilChanged()
      ).subscribe(val => {
        if (val && val.length >= 2) {
          const search = val.toLowerCase();
          const clientsMap = new Map<string, {id: string, nombre: string, email: string}>();
          this.documentosGlobal().forEach(d => {
            const nom = d.clienteNombre || '';
            const email = d.clienteEmail || '';
            if (nom.toLowerCase().includes(search) || email.toLowerCase().includes(search)) {
               clientsMap.set(d.clienteId, { id: d.clienteId, nombre: nom, email: email });
            }
          });
          this.filteredClientes.set(Array.from(clientsMap.values()));
          this.showClienteDropdown.set(true);
        } else {
          this.filteredClientes.set([]);
          this.showClienteDropdown.set(false);
          // Auto apply filter when cleared
          if (!val) {
            this.filtros.clienteBusqueda = '';
            this.aplicarFiltros();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  seleccionarTramite(tramite: string) {
    this.tramiteControl.setValue(tramite, { emitEvent: false });
    this.filtros.tramiteName = tramite;
    this.showTramiteDropdown.set(false);
    this.aplicarFiltros();
  }

  limpiarTramite() {
    this.tramiteControl.setValue('');
    this.filtros.tramiteName = '';
    this.showTramiteDropdown.set(false);
    this.aplicarFiltros();
  }

  seleccionarCliente(cliente: {id: string, nombre: string, email: string}) {
    // Prefer name, fallback to email for display
    const displayVal = cliente.nombre && cliente.nombre !== 'Cliente Desconocido' ? cliente.nombre : cliente.email;
    this.clienteControl.setValue(displayVal, { emitEvent: false });
    this.filtros.clienteBusqueda = displayVal;
    this.showClienteDropdown.set(false);
    this.aplicarFiltros();
  }

  limpiarCliente() {
    this.clienteControl.setValue('');
    this.filtros.clienteBusqueda = '';
    this.showClienteDropdown.set(false);
    this.aplicarFiltros();
  }

  setTipo(tipo: 'PENDIENTES' | 'HISTORICO') {
    if (this.tipoActivo() !== tipo) {
      this.tipoActivo.set(tipo);
      this.limpiarFiltros();
      this.cargarDatos();
    }
  }

  cargarDatos() {
    this.isLoading.set(true);
    this.gestionService.obtenerDocumentos(this.tipoActivo()).subscribe({
      next: (docs) => {
        this.documentosGlobal.set(docs);
        this.aplicarFiltros();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando documentos', err);
        this.isLoading.set(false);
      }
    });
  }

  limpiarFiltros() {
    this.filtros = {
      startDate: '',
      endDate: '',
      tramiteName: '',
      clienteBusqueda: ''
    };
    this.tramiteControl.setValue('', { emitEvent: false });
    this.clienteControl.setValue('', { emitEvent: false });
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let filtered = this.documentosGlobal();

    if (this.filtros.startDate) {
      const start = new Date(this.filtros.startDate).getTime();
      filtered = filtered.filter(doc => new Date(doc.tramiteFechaCreacion).getTime() >= start);
    }
    if (this.filtros.endDate) {
      const end = new Date(this.filtros.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(doc => new Date(doc.tramiteFechaCreacion).getTime() <= end.getTime());
    }
    if (this.filtros.tramiteName && this.filtros.tramiteName.trim() !== '') {
      const searchName = this.filtros.tramiteName.toLowerCase().trim();
      filtered = filtered.filter(doc => doc.tramiteNombre && doc.tramiteNombre.toLowerCase().includes(searchName));
    }
    if (this.filtros.clienteBusqueda && this.filtros.clienteBusqueda.trim() !== '') {
      const searchClient = this.filtros.clienteBusqueda.toLowerCase().trim();
      filtered = filtered.filter(doc => {
        const clientName = doc.clienteNombre ? doc.clienteNombre.toLowerCase() : '';
        const clientEmail = doc.clienteEmail ? doc.clienteEmail.toLowerCase() : '';
        return clientName.includes(searchClient) || clientEmail.includes(searchClient);
      });
    }

    this.documentos.set(filtered);
  }

  abrirDocumento(doc: DocumentoGestionDTO) {
    this.docSeleccionado.set(doc);
  }

  cerrarModal() {
    this.docSeleccionado.set(null);
  }

  crearMetadataMock(doc: DocumentoGestionDTO | any): any {
    const deptId = this.user()?.departamentoId || 'UNKNOWN';
    // Fix Jackson serialization quirks where boolean might be named differently
    const isColab = doc.esColaborativo !== undefined ? doc.esColaborativo : (doc.isEsColaborativo !== undefined ? doc.isEsColaborativo : (doc.extension === 'WORD' || doc.extension === 'EXCEL'));

    return {
      archivoId: doc.archivoId,
      rutaS3: doc.rutaS3,
      nombreOriginal: doc.nombreOriginal,
      formato: doc.extension,
      esColaborativo: isColab,
      permisos: {
        [deptId]: doc.editable ? 'EDICION' : 'LECTURA'
      }
    };
  }
}
