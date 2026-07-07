/**
 * @file toast.ts
 * @description
 * This file defines a simple, custom service for displaying toast-like error messages.
 *
 * @overview
 * This service uses an Angular `signal` to hold an error message. The `error()` method sets the message, which can be displayed by a component that subscribes to the signal. A timeout automatically clears the message.
 *
 * Connections:
 *   (Components) -> TOAST.TS -> (updates signal) -> (Root Component listening to signal)
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  errorMessage = signal<string | null>(null);

  error(msg: string) {
    this.errorMessage.set(msg);

    setTimeout(() => {
      this.errorMessage.set(null);
    }, 3500);
  }
}
