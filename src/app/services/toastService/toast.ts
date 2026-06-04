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
