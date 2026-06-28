import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/**
 * App-wide toast/notification service. Components call success()/error()/info()
 * instead of setting inline banner strings or using alert(). The global
 * <app-toast> container subscribes to toasts$ and renders them.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  private nextId = 1;
  private readonly defaultDuration = 3500;

  private show(type: ToastType, message: string, duration = this.defaultDuration) {
    if (!message) return;

    const toast: Toast = { id: this.nextId++, type, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    /* Auto-dismiss after the duration. */
    setTimeout(() => this.dismiss(toast.id), duration);
  }

  success(message: string, duration?: number) {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number) {
    this.show('error', message, duration);
  }

  info(message: string, duration?: number) {
    this.show('info', message, duration);
  }

  dismiss(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }
}
