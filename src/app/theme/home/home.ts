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
  token = localStorage.getItem('token');
  router: Router = inject(Router);
  toast : ToastrService = inject(ToastrService);

  ngOnInit() {
    if (!this.token) {
      this.toast.warning('You are not authorized to use this path');
      this.router.navigate(['/login']);
    }
  }
}
