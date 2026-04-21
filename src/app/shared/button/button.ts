import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="classes()"
      [type]="type()"
      [attr.aria-label]="ariaLabel()"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly ariaLabel = input<string | null>(null);
  readonly fullWidth = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-purple-500 focus-visible:outline-offset-2';

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-purple-700 hover:bg-purple-600 text-white shadow-lg shadow-purple-700/30 hover:shadow-purple-600/40 active:scale-95',
      outline:
        'border-2 border-purple-700 text-purple-300 hover:bg-purple-700/20 hover:text-white active:scale-95',
      ghost:
        'text-purple-300 hover:text-white hover:bg-white/5 active:scale-95',
      danger:
        'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 active:scale-95',
    };

    const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';
    const activeClasses = this.disabled() ? disabledClasses : 'cursor-pointer';
    const width = this.fullWidth() ? 'w-full' : '';

    return `${base} ${sizes[this.size()]} ${variants[this.variant()]} ${activeClasses} ${width}`;
  });
}
