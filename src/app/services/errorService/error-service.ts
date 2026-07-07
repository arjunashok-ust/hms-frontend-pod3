/**
 * @file error-service.ts
 * @description
 * This file defines a simple, centralized service for handling and displaying errors.
 *
 * @overview
 * This service provides a single `handleError` method that logs an error message to the console and displays it to the user via a `ToastrService` notification. It is a basic utility for centralizing UI error feedback.
 *
 * Connections:
 *   (Components) -> ERROR-SERVICE.TS -> [console, ToastrService]
 */
import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  toast: ToastrService = inject(ToastrService);
  handleError(message: string) {
    console.error('Centralized Error:', message);
    this.toast.error(message);
  }
}
