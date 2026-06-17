import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  templateUrl: 'access-denied.htm',
  styleUrl: 'access-denied.css',
  imports: [RouterLink,CommonModule]
})
export class AccessDeniedComponent {
  role = localStorage.getItem("role");
}
