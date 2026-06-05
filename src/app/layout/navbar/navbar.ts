import { Component } from "@angular/core";

import { Router } from "@angular/router";

@Component({
  selector: "app-navbar",

  standalone: true,

  imports: [],

  templateUrl: "./navbar.html",

  styleUrl: "./navbar.css",
})
export class Navbar {
  constructor(private router: Router) {}

  logout() {
    // CLEAR STORAGE

    localStorage.clear();
    // REDIRECT LOGIN
    this.router.navigate(["/login"]);
  }
}
