import { Component, OnInit } from '@angular/core';

import {

  Router,
  RouterOutlet

} from '@angular/router';

import { CommonModule } from '@angular/common';

import { Navbar } from '../navbar/navbar';

import { Sidebar } from '../sidebar/sidebar';
import { Auth } from '../../services/auth';
import { PermissionService } from '../../services/permission';

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

export class DashboardLayout implements OnInit {

  constructor(
    public router:Router,
    readonly auth: Auth,
    readonly permissionService: PermissionService
  ){}

  ngOnInit(): void {
    /* PERMISSIONS ARE NEVER IN THE JWT — FETCH FRESH ON EVERY PROTECTED-LAYOUT LOAD */
    this.auth.getCurrentUser().subscribe({
      next: (response: any) => {
        this.permissionService.setPermissions(response.data.permissions || []);
      },
      error: (err: any) => {
        console.log(err);
      },
    });
  }

}