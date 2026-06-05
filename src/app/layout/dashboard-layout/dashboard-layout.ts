import { Component } from '@angular/core';

import {

  Router,
  RouterOutlet

} from '@angular/router';

import { CommonModule } from '@angular/common';

import { Navbar } from '../navbar/navbar';

import { Sidebar } from '../sidebar/sidebar';

@Component({

  selector: 'app-dashboard-layout',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    Navbar,
    Sidebar
  ],

  templateUrl: './dashboard-layout.html',

  styleUrl: './dashboard-layout.css'

})

export class DashboardLayout {

  constructor(

    public router:Router

  ){}

}