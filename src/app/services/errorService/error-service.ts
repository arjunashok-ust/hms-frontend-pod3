import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  handleError(message: string) {
    console.error('Centralized Error:', message);
    alert(message);
  }
}
