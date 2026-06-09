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
