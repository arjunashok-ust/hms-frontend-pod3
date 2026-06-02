import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient',
  imports: [CommonModule],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class Patient {
  patients: any[] = [];
}
