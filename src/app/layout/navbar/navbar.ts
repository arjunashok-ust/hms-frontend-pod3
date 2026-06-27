import { Component } from "@angular/core";

import { Router } from "@angular/router";
import { Auth } from "../../services/auth";

@Component({
  selector: "app-navbar",

  standalone: true,

  imports: [],

  templateUrl: "./navbar.html",

  styleUrl: "./navbar.css",
})
export class Navbar {
  constructor(
    readonly router: Router,
    readonly auth: Auth,
  ) {}

  logout() {
    
    this.auth.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout() {
    localStorage.clear();
    this.router.navigate(["/login"]);
  }
}
