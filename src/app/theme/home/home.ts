import {  Component, inject, OnInit } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar';
import { HeaderComponent } from './header/header';
import { Router,  RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-home',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class HomeComponent implements OnInit {
  token = localStorage.getItem('token');
  router : Router = inject(Router);

  ngOnInit(){
    if(!this.token){
      alert("You are not authorized to use this path");
      this.router.navigate(['/login']);
    }
  }
}
