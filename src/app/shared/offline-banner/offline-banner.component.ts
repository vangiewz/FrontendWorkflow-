import { Component, inject } from '@angular/core';
import { NetworkStatusService } from '../../services/network-status.service';
import { OfflineQueueService } from '../../services/offline-queue.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: `
    @if (!networkStatus.isOnline()) {
      <div class="offline-banner" role="alert">
        <div class="offline-banner-content">
          <div class="offline-banner-left">
            <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            <span class="offline-text">Sin conexión a Internet</span>
          </div>
          @if (queue.pendingCount() > 0) {
            <div class="offline-badge">
              <span class="offline-badge-dot"></span>
              {{ queue.pendingCount() }} pendiente{{ queue.pendingCount() > 1 ? 's' : '' }}
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .offline-banner-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #92400e 0%, #78350f 100%);
      border-bottom: 1px solid rgba(251, 191, 36, 0.3);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .offline-banner-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .offline-icon {
      width: 16px;
      height: 16px;
      color: #fbbf24;
      flex-shrink: 0;
    }

    .offline-text {
      font-size: 13px;
      font-weight: 600;
      color: #fef3c7;
      letter-spacing: 0.02em;
    }

    .offline-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 10px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      color: #fde68a;
    }

    .offline-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f59e0b;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class OfflineBannerComponent {
  readonly networkStatus = inject(NetworkStatusService);
  readonly queue = inject(OfflineQueueService);
}
