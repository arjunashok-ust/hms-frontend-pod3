import { Component, OnInit, ChangeDetectorRef } from "@angular/core";

import { RouterLink } from "@angular/router";

import { CommonModule } from "@angular/common";

import { Auth } from "../../services/auth";

@Component({
  selector: "app-sidebar",

  standalone: true,

  imports: [RouterLink, CommonModule],

  templateUrl: "./sidebar.html",

  styleUrl: "./sidebar.css",
})
export class Sidebar implements OnInit {
  user: any;

  isAdmin = false;

  constructor(
    private auth: Auth,

    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        this.loadCurrentUser();
      }
    }
  }

  loadCurrentUser() {
    this.auth.getCurrentUser().subscribe({
      next: (response: any) => {
        console.log(response);

        setTimeout(() => {
          this.user = response;

          this.isAdmin = response.role === "admin";

          this.cd.detectChanges();
        });
      },

      error: (err: any) => {
        console.log(err);
      },
    });
  }
}
