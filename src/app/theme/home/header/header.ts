import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit {
  readonly router: Router = inject(Router);
  readonly authService: AuthService = inject(AuthService);
  readonly toast: ToastrService = inject(ToastrService);

  role: string = '';

  ngOnInit(): void {
    this.role = localStorage.getItem('role') ?? '';
  }

  logout() {
    this.authService.logout().subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Logout sucessfull.');
        localStorage.clear();
      },
      error: (err) => {
        this.toast.error('Error Occured', err.message || 'While logging out');
      },
    });
    this.router.navigate(['/login']);
  }
}
