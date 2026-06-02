import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  router = inject(Router);

  user = JSON.parse(localStorage.getItem('employeeData') || '{}');

  name = this.user?.name || 'User';
  role = this.user?.designation || 'Employee';

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}