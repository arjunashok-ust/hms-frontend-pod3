import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit {
  router: Router = inject(Router);
  name: string = "";
  role: string ="";

  ngOnInit(): void {
    this.name = localStorage.getItem('name') || '';
    this.role = localStorage.getItem('role') || '';
  }
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
