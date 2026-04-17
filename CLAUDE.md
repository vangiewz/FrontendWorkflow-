# Frontend Workflow System (Angular 21 + TailwindCSS 4)

Aplicación web para el sistema de gestión de workflows/trámites.

## 🛠 Tech Stack

- **Framework:** Angular 21.2 (Standalone Components)
- **Language:** TypeScript 5.9 (strict mode)
- **Styling:** TailwindCSS 4 + PostCSS
- **SSR:** Angular SSR con Express 5
- **Testing:** Vitest + jsdom
- **Build Tool:** Angular CLI 21

## 🏗 Reglas de Código Obligatorias

### TypeScript
- Usar strict type checking en todo momento.
- Preferir inferencia de tipo cuando sea obvio.
- **Prohibido usar `any`**; usar `unknown` si el tipo es incierto.

### Angular — Componentes
- **Siempre** usar standalone components (NO NgModules).
- **NO poner** `standalone: true` en decoradores — es el default en Angular 21+.
- Usar `ChangeDetectionStrategy.OnPush` en todos los `@Component`.
- Usar `input()` y `output()` functions en vez de decoradores `@Input`/`@Output`.
- Usar `computed()` para estado derivado.
- **NO usar** `@HostBinding` ni `@HostListener` — usar el objeto `host` del decorador.
- **NO usar** `ngClass` ni `ngStyle` — usar `class` y `style` bindings.
- Usar `NgOptimizedImage` para imágenes estáticas.
- Componentes pequeños con responsabilidad única.
- Preferir inline templates para componentes pequeños.
- Templates/estilos externos con rutas relativas al archivo TS.

### Templates
- Mantener templates simples, sin lógica compleja.
- Usar control flow nativo: `@if`, `@for`, `@switch` (NO `*ngIf`, `*ngFor`, `*ngSwitch`).
- Usar async pipe para observables.
- No asumir globals como `new Date()`.

### State Management
- Signals para estado local de componentes.
- `computed()` para estado derivado.
- Transformaciones de estado puras y predecibles.
- **NO usar** `mutate` en signals — usar `update` o `set`.

### Formularios
- Preferir **Reactive Forms** sobre Template-driven.

### Servicios
- Diseñados con responsabilidad única.
- Usar `providedIn: 'root'` para singletons.
- Usar `inject()` en vez de inyección por constructor.

### Routing
- Implementar lazy loading para rutas de features.

### Accesibilidad (OBLIGATORIO)
- Debe pasar todos los checks de AXE.
- Cumplir WCAG AA: focus management, color contrast, ARIA attributes.

## 🚀 Comandos

- **Desarrollo:** `npm start` (ng serve)
- **Build:** `npm run build`
- **Tests:** `npm test`
- **SSR:** `npm run serve:ssr:frontend-workflow`
