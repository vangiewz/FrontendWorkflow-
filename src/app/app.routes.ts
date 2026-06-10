import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
    canActivate: [authGuard],
  },

  // ─── Paquete 1: Administración Organizacional (solo ADMIN) ───
  {
    path: 'paquetes/admin-organizacional',
    loadComponent: () =>
      import('./pages/paquete-hub/paquete-hub').then((m) => m.PaqueteHubPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: {
      title: 'Paquete: Administración Organizacional',
      description: 'Gestiona la estructura interna de la institución: registra funcionarios, asigna departamentos y mantén el directorio del personal autorizado para operar en el sistema.',
      cards: [
        {
          title: 'Gestionar Personal',
          description: 'Registra, edita y administra los usuarios internos (Funcionarios y Administradores) del sistema.',
          icon: '👥',
          route: '/usuarios'
        },
        {
          title: 'Gestionar Clientes',
          description: 'Administra, activa y suspende a los usuarios externos (Clientes) del sistema.',
          icon: '🧑‍💼',
          route: '/clientes'
        },
        {
          title: 'Bitácora del Sistema',
          description: 'Registro de auditoría con todas las acciones y eventos realizados en el sistema y la app móvil.',
          icon: '📋',
          route: '/bitacora'
        },
        {
          title: 'Gestionar Departamentos',
          description: 'Crea y configura las áreas organizacionales a las que se asignarán los funcionarios.',
          icon: '🏢',
          route: '/departamentos'
        }
      ]
    }
  },

  // ─── Paquete 2: Configuración e IA (ADMIN y FUNCIONARIO) ───
  {
    path: 'paquetes/configuracion-ia',
    loadComponent: () =>
      import('./pages/paquete-hub/paquete-hub').then((m) => m.PaqueteHubPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: {
      title: 'Paquete: Configuración e Inteligencia Artificial',
      description: 'El núcleo del sistema. Diseña políticas de negocio en lenguaje natural y deja que la IA genere automáticamente las rutas de trámites, los formularios JSON y los actores responsables.',
      cards: [
        {
          title: 'Diseñar Políticas de Negocio',
          description: 'Usa el diseñador colaborativo con IA para crear y gestionar los flujos de trabajo institucionales.',
          icon: '🧠',
          route: '/workflows'
        },
        {
          title: 'Analíticas de Cuellos de Botella',
          description: 'El microservicio de IA analiza tiempos históricos y detecta los departamentos con mayor retraso.',
          icon: '📊',
          route: '/analytics'
        },
        {
          title: 'Generador de Reportes con IA',
          description: 'Chat interactivo con IA para extraer, filtrar y generar archivos físicos (Excel, PDF, Word) de los trámites del sistema.',
          icon: '🤖',
          route: '/reportes-ia'
        },
        {
          title: 'Simulador de Enrutamiento Predictivo',
          description: 'Prueba la red neuronal que asigna prioridad, tiempo estimado y detecta anomalías en nuevos trámites.',
          icon: '🛣️',
          route: '/routing-predictivo'
        },
        {
          title: 'Motor de Escalamiento SLA',
          description: 'Fuerza la revisión y visualiza en tiempo real los trámites estancados que han sido escalados a prioridad ALTA.',
          icon: '⏱️',
          route: '/sla-dashboard'
        }
      ]
    }
  },
  {
    path: 'sla-dashboard',
    loadComponent: () =>
      import('./pages/sla-dashboard/sla-dashboard.component').then((m) => m.SlaDashboardComponent),
    canActivate: [authGuard, roleGuard(['ADMIN'])]
  },

  // ─── Paquete 3: Operación y Gestión de Trámites (ADMIN y FUNCIONARIO) ───
  {
    path: 'paquetes/operacion-tramites',
    loadComponent: () =>
      import('./pages/paquete-hub/paquete-hub').then((m) => m.PaqueteHubPage),
    canActivate: [authGuard, roleGuard(['ADMIN', 'FUNCIONARIO'])],
    data: {
      title: 'Paquete: Operación y Gestión de Trámites',
      description: 'Ejecuta y supervisa el ciclo de vida completo de los trámites institucionales: desde la solicitud inicial del cliente hasta la resolución final por parte del funcionario.',
      cards: [
        {
          title: 'Atender y Procesar Trámites',
          description: 'Accede a la bandeja de tareas, completa formularios dinámicos y avanza los trámites en curso.',
          icon: '⚙️',
          route: '/tramites'
        }
      ]
    }
  },
  
  // ─── Paquete 5: Gestión Documental (ADMIN y FUNCIONARIO) ───
  {
    path: 'paquetes/gestion-documental',
    loadComponent: () =>
      import('./pages/paquete-hub/paquete-hub').then((m) => m.PaqueteHubPage),
    canActivate: [authGuard, roleGuard(['ADMIN', 'FUNCIONARIO'])],
    data: {
      title: 'Módulo: Gestión Documental',
      description: 'Accede y administra de forma segura todos los documentos asociados a los procesos de tu departamento.',
      cards: [
        {
          title: 'Gestionar Documentos',
          description: 'Explora los documentos pendientes e históricos con seguridad de Doble Candado.',
          icon: '📁',
          route: '/gestion-documental'
        },
        {
          title: 'Auditoría Documental',
          description: 'Registro inmutable de actividades y trazabilidad de documentos.',
          icon: '🛡️',
          route: '/gestion-documental/auditoria',
          requiredRole: 'ADMIN'
        }
      ]
    }
  },

  // ─── Paquete 4: Seguridad y Control de Acceso (Todos) ───
  {
    path: 'paquetes/seguridad-acceso',
    loadComponent: () =>
      import('./pages/seguridad/seguridad-hub').then((m) => m.SeguridadHubPage),
    canActivate: [authGuard],
  },

  // ─── Rutas funcionales internas (destino de las cards) ───
  {
    path: 'departamentos',
    loadComponent: () =>
      import('./pages/departamentos/departamentos').then((m) => m.DepartamentosPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'workflows',
    loadComponent: () =>
      import('./pages/workflow-designer/listar-workflows/listar-workflows').then((m) => m.ListarWorkflowsPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'designer',
    loadComponent: () =>
      import('./pages/workflow-designer/workflow-designer').then((m) => m.WorkflowDesignerPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'designer/:id',
    loadComponent: () =>
      import('./pages/workflow-designer/workflow-designer').then((m) => m.WorkflowDesignerPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./pages/usuarios/gestionar-usuarios/gestionar-usuarios').then((m) => m.GestionarUsuariosPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./pages/usuarios/gestionar-clientes/gestionar-clientes').then((m) => m.GestionarClientesPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'bitacora',
    loadComponent: () =>
      import('./pages/usuarios/bitacora/bitacora').then((m) => m.BitacoraComponent),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'usuarios/crear',
    loadComponent: () =>
      import('./pages/usuarios/crear-usuario/crear-usuario').then((m) => m.CrearUsuarioPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'tramites',
    loadComponent: () =>
      import('./pages/tramites/kanban/tramites-kanban').then((m) => m.TramitesKanbanPage),
    canActivate: [authGuard, roleGuard(['ADMIN', 'FUNCIONARIO'])],
  },
  {
    path: 'tramites/:id',
    loadComponent: () =>
      import('./pages/tramites/detalle/tramite-detalle').then((m) => m.TramiteDetallePage),
    canActivate: [authGuard, roleGuard(['ADMIN', 'FUNCIONARIO'])],
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/analytics').then((m) => m.AnalyticsPage),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'reportes-ia',
    loadComponent: () =>
      import('./pages/analytics/chat-report/chat-report.component').then((m) => m.ChatReportComponent),
    canActivate: [authGuard, roleGuard(['ADMIN', 'FUNCIONARIO'])],
  },
  {
    path: 'gestion-documental',
    loadComponent: () =>
      import('./pages/gestion-documental/gestion-documental-dashboard.component').then((m) => m.GestionDocumentalDashboardComponent),
    canActivate: [authGuard, roleGuard(['ADMIN', 'FUNCIONARIO'])],
  },
  {
    path: 'gestion-documental/auditoria',
    loadComponent: () =>
      import('./pages/gestion-documental/components/auditoria-documental/auditoria-documental.component').then((m) => m.AuditoriaDocumentalComponent),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: 'routing-predictivo',
    loadComponent: () =>
      import('./pages/routing-predictivo/routing-predictivo.component').then((m) => m.RoutingPredictivoComponent),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
];
