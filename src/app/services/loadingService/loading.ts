/**
 * @file loading.ts
 * @description
 * This file defines a simple service for managing a global loading state.
 *
 * @overview
 * This service uses an Angular `signal` to track a boolean `isLoading` state.
 * It provides `show()` and `hide()` methods that can be called from anywhere in the application (e.g., in an HTTP interceptor) to toggle a global loading indicator.
 *
 * Connections:
 *   (Any Component/Interceptor) -> LOADING.TS -> (updates signal) -> (Any Component listening to signal)
 */
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  isLoading = signal<boolean>(false);

  show(): void {
    this.isLoading.set(true);
  }

  hide(): void {
    this.isLoading.set(false);
  }
}
