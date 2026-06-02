import { Component, inject, OnInit } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar';
import { HeaderComponent } from './header/header';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  router = inject(Router);
  toast = inject(ToastrService);

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.toast.warning('Unauthorized access');
      this.router.navigate(['/login']);
    }
  }
}