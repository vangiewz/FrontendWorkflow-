import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Using ngModel for simple databinding here

export interface FormFieldItem {
  key: string;
  type: string; // string, number, boolean, date, datetime
  description: string;
  isRequired: boolean;
}

@Component({
  selector: 'app-json-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (fields().length === 0) {
        <div class="text-center p-4 border border-dashed border-surface-700 rounded-lg text-gray-500 text-xs">
          No hay campos definidos.
        </div>
      }

      @for (field of fields(); track $index) {
        <div class="flex flex-col gap-2 p-3 bg-surface-900 border border-surface-700 rounded-lg group transition-all hover:border-emerald-500/30">
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-gray-400">Campo #{{ $index + 1 }}</span>
            <button class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300" (click)="removeField($index)" title="Eliminar campo">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
               <label class="text-[10px] text-gray-500 uppercase tracking-wide">Clave Interna (ID)</label>
               <input type="text" [ngModel]="field.key" (ngModelChange)="updateField($index, {key: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-600" placeholder="Ej. nombre_completo">
            </div>
            <div>
               <label class="text-[10px] text-gray-500 uppercase tracking-wide">Tipo de Dato</label>
               <select [ngModel]="field.type" (ngModelChange)="updateField($index, {type: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none appearance-none">
                 <option value="string">Texto</option>
                 <option value="number">Número</option>
                 <option value="boolean">Verdadero / Falso (Checkbox)</option>
                 <option value="date">Fecha</option>
                 <option value="datetime">Fecha y Hora</option>
               </select>
            </div>
          </div>
          
          <div>
            <label class="text-[10px] text-gray-500 uppercase tracking-wide">Etiqueta o Descripción (Visible para usuario)</label>
            <input type="text" [ngModel]="field.description" (ngModelChange)="updateField($index, {description: $event})" class="w-full bg-surface-800 border border-surface-700 rounded p-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-600" placeholder="Ej. Escriba su nombre completo">
          </div>

          <div class="flex items-center gap-2 mt-1">
             <input type="checkbox" [ngModel]="field.isRequired" (ngModelChange)="updateField($index, {isRequired: $event})" class="w-3.5 h-3.5 rounded border-surface-600 text-emerald-500 bg-surface-800 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer">
             <label class="text-xs text-gray-400 cursor-pointer" (click)="updateField($index, {isRequired: !field.isRequired})">Establecer como obligatorio</label>
          </div>
        </div>
      }

      <button class="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/60 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase flex items-center justify-center gap-2" (click)="addField()">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Añadir Campo
      </button>
    </div>
  `
})
export class JsonFormBuilderComponent {
  schema = input<any>({});
  schemaChange = output<any>();

  fields = signal<FormFieldItem[]>([]);
  isInternalChange = false;

  constructor() {
    effect(() => {
      const currentSchema = this.schema();
      if (!this.isInternalChange) {
         this.parseSchema(currentSchema);
      }
      this.isInternalChange = false;
    });
  }

  parseSchema(s: any) {
     if (!s || !s.properties) {
        this.fields.set([]);
        return;
     }
     
     const props = s.properties || {};
     const req = s.required || [];
     
     const parsedFields = Object.keys(props).map(k => {
        // Detectar campos de fecha por format
        let fieldType = props[k]?.type || 'string';
        if (fieldType === 'string' && props[k]?.format === 'date') fieldType = 'date';
        if (fieldType === 'string' && props[k]?.format === 'date-time') fieldType = 'datetime';
        return {
           key: k,
           type: fieldType,
           description: props[k]?.description || '',
           isRequired: req.includes(k)
        };
     });
     
     this.fields.set(parsedFields);
  }

  addField() {
    this.fields.update(f => [...f, {
       key: `campo${f.length + 1}`,
       type: 'string',
       description: '',
       isRequired: false
    }]);
    this.emitChanges();
  }

  updateField(index: number, changes: Partial<FormFieldItem>) {
    this.fields.update(fields => {
      const newFields = [...fields];
      newFields[index] = { ...newFields[index], ...changes };
      return newFields;
    });
    this.emitChanges();
  }

  removeField(index: number) {
    this.fields.update(f => f.filter((_, i) => i !== index));
    this.emitChanges();
  }

  emitChanges() {
    this.isInternalChange = true;
    const f = this.fields();
    
    const properties: any = {};
    const required: string[] = [];
    
    f.forEach(item => {
        const safeKey = item.key.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'campo';
        const prop: any = {
           description: item.description
        };
        // Mapear tipos visuales a JSON Schema
        if (item.type === 'date') {
          prop.type = 'string';
          prop.format = 'date';
        } else if (item.type === 'datetime') {
          prop.type = 'string';
          prop.format = 'date-time';
        } else {
          prop.type = item.type;
        }
        properties[safeKey] = prop;
        if (item.isRequired) {
           required.push(safeKey);
        }
    });

    const newSchema = {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined
    };
    
    // Si no quedan propiedades, por simplicidad enviamos objeto base vacío
    if (Object.keys(properties).length === 0) {
      this.schemaChange.emit({});
      return;
    }

    this.schemaChange.emit(newSchema);
  }
}
