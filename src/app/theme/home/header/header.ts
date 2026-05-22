import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  router : Router= inject(Router);
  name = localStorage.getItem('name');
  role = localStorage.getItem('role');
  
  logout(){
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
