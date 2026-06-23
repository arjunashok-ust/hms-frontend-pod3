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

  // FIX: Explicit output names that exactly match the parent HTML
  @Output() onCloseModal = new EventEmitter<void>();
  @Output() onDeleteRecord = new EventEmitter<string>();

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
    this.onCloseModal.emit();
  }

  onDelete() {
    this.onDeleteRecord.emit(this.record._id);
  }
}