import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';
import { DialogComponent } from './shared/dialog/dialog.component';
import { OfflineBannerComponent } from './shared/offline-banner/offline-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, DialogComponent, OfflineBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-offline-banner />
    <router-outlet />
    <app-toast />
    <app-dialog />
  `
})
export class App {}
