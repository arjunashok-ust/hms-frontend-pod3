import { Component } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar';
import { HeaderComponent } from './header/header';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-home',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class HomeComponent {}
