import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';
import { DialogComponent } from './shared/dialog/dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-toast />
    <app-dialog />
  `
})
export class App {}
