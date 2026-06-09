import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './access-denied.html',
  styleUrls: ['./access-denied.css']
})
export class AccessDenied { 
  constructor(
    private readonly router: Router,
  ){}

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}