/**
 * @file record-modal.ts
 * @description
 * This file defines a modal component for viewing the details of a medical record.
 *
 * @overview
 * This is a presentational component that displays a read-only view of a medical record.
 * It receives the record data and lists of patients/doctors via `@Input()` to resolve IDs into names.
 * It emits events to its parent (`MedicalRecordComponent`) to close the modal or to request the deletion of the record.
 *
 * Connections:
 *   MedicalRecordComponent -> (via @Input) -> RECORD-MODAL.TS -> (via @Output event) -> MedicalRecordComponent
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-record-details-modal',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './record-modal.html',
  styleUrls: ['./record-modal.css']
})
export class RecordDetailsModalComponent {
  @Input() record: any = null;
  @Input() patients: any[] = [];
  @Input() doctors: any[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() deleteRecord = new EventEmitter<string>();

  getPatientName(id: string): string {
    if (!id) return 'Unknown Patient';
    const pat = this.patients.find(p => p.UHID === id);
    return pat ? pat.name : id;
  }

  getDoctorName(id: string): string {
    if (!id) return 'Unknown Doctor';
    const doc = this.doctors.find(d => d.employeeCode === id);
    return doc ? doc.name : id;
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.substring(0, 2).toUpperCase();
  }

  onClose() {
    this.closeModal.emit();
  }

  onDelete() {
    this.deleteRecord.emit(this.record._id);
  }
}