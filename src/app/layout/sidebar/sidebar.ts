import { Component, OnInit, ChangeDetectorRef } from "@angular/core";

import { RouterLink,RouterLinkActive } from "@angular/router";

import { CommonModule } from "@angular/common";

import { Auth } from "../../services/auth";

@Component({
  selector: "app-sidebar",

  standalone: true,

  imports: [RouterLink,RouterLinkActive, CommonModule],

  templateUrl: "./sidebar.html",

  styleUrl: "./sidebar.css",
})
export class Sidebar implements OnInit {
  user: any;
  nodes: any[] = [];

  constructor(
    readonly auth: Auth,

    readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (globalThis.window) {
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

        this.user = response.data;

        this.loadNodes();
      },

      error: (err: any) => {
        console.log(err);
      },
    });
  }

  loadNodes() {
    this.auth.getNodes().subscribe({
      next: (response: any) => {
        console.log(response);

        this.nodes = (response.data || [])
          .filter((node: any) => node.role.includes(this.user?.role))
          .sort((a: any, b: any) => a.node_id - b.node_id);

        this.cd.detectChanges();
      },

      error: (err: any) => {
        console.log(err);
      },
    });
  }
}
