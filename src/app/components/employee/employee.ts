import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { TimeSlotUtil, GeneratedSlot } from '../../utils/timeSlot';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee.html',
  styleUrls: ['./employee.css'],
})
export class Employee implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  isLoading = true;
  showPendingApprovals = false;
  pendingCount = 0;

  searchTerm: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  departments = ["OPD", "IPD", "ADMIN", "LAB", "PHARMACY"]

  showAddModal = false;
  isSubmittingModal = false;
  modalError: string | null = null;
  newEmployeeForm!: FormGroup;

  medicalRoles = ['DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'];

  availableRoles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'LAB_TECH', label: 'Lab Technician' },
    { value: 'PHARMACIST', label: 'Pharmacist' },
    { value: 'RECEPTIONIST', label: 'Receptionist' },
  ];
  rowSubSlotsMap: { [uniqueId: string]: GeneratedSlot[] } = {};
  availableHours: string[] = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, '0')}:00`,
  );

  isEditMode = false;
  editingEmployeeId: string | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.apiService.getAllEmployees().subscribe({
      next: (data: any) => {
        if (!Array.isArray(data)) {
          console.error('Backend did not return an array. Data:', data);
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        this.employees = data;
        this.pendingCount = data.filter(
          (emp: any) => emp.status === 'ADMIN_APPROVAL_PENDING',
        ).length;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching employees', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleApprovalsView() {
    this.showPendingApprovals = !this.showPendingApprovals;
    if (this.showPendingApprovals) {
      this.searchTerm = '';
      this.selectedDepartment = '';
      this.selectedStatus = '';
    }
    this.applyFilters();
  }

  applyFilters() {
    this.filteredEmployees = this.employees.filter((emp) => {
      if (this.showPendingApprovals) return emp.status === 'ADMIN_APPROVAL_PENDING';
      if (emp.status === 'ADMIN_APPROVAL_PENDING') return false;

      const matchesSearch =
        !this.searchTerm ||
        emp.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesDept = !this.selectedDepartment || emp.department === this.selectedDepartment;

      let matchesStatus = true;
      if (this.selectedStatus) {
        // FIX: Force to uppercase to prevent case-mismatch bugs
        const normalizedStatus = emp.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
        matchesStatus = normalizedStatus === this.selectedStatus;
      }

      return matchesSearch && matchesDept && matchesStatus;
    });
  }

  getRoleString(role: any): string {
    if (!role) return 'Staff';
    return Array.isArray(role) ? role[0] : String(role);
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  }

  approveEmployee(emp: any) {
    if (confirm(`Approve account for ${emp.name}?`)) {
      this.apiService.approveEmployee(emp.employeeCode).subscribe({
        next: (response) => {
          alert('Employee approved successfully!');

          this.fetchEmployees();
        },
        error: (err) => {
          alert('Error approving employee: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }
  deleteEmployee(id: string) {
    if (
      confirm(`Are you absolutely sure you want to delete employee ${id}? This cannot be undone.`)
    ) {
      this.apiService.deleteEmployee(id).subscribe({
        next: () => {
          alert('Employee deleted successfully.');
          this.fetchEmployees();
        },
        error: (err) => {
          alert('Error deleting employee: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }

  initForm() {
    this.newEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(9)]],
      role: ['', Validators.required],
      status: ['ACTIVE', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      joiningDate: ['', Validators.required],
      medicalRegistrationNo: [''],
      specialization: [''],
      qualification: [''],
      consultationFee: [null],
      availabilitySlots: this.fb.array([]),
    });

    this.newEmployeeForm.get('role')?.valueChanges.subscribe((role) => {
      this.updateMedicalValidators(role?.toUpperCase() || '');
    });
  }

  openModal() {
    this.showAddModal = true;
  }

  closeModal() {
    this.showAddModal = false;
    this.isEditMode = false;
    this.editingEmployeeId = null;
    this.newEmployeeForm.reset({ status: 'ACTIVE' });
    this.rowSubSlotsMap = {};
    while (this.availabilitySlots.length !== 0) this.removeSlot(0);
  }

  get isMedicalRole(): boolean {
    const role = this.newEmployeeForm.get('role')?.value?.toUpperCase();
    return this.medicalRoles.includes(role);
  }

  get isDoctor(): boolean {
    return this.newEmployeeForm.get('role')?.value?.toUpperCase() === 'DOCTOR';
  }

  get availabilitySlots(): FormArray {
    return this.newEmployeeForm.get('availabilitySlots') as FormArray;
  }

  addSlot() {
    const uniqueId = 'slot_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const slotGroup = this.fb.group({
      id: [uniqueId],
      dayOfWeek: ['', Validators.required], // NEW: Require the day
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      checkedSlots: this.fb.array([]),
    });

    slotGroup.valueChanges.subscribe((changes) => {
      this.generateHourlySlots(uniqueId, slotGroup, changes.startTime ?? '', changes.endTime ?? '');
    });

    this.availabilitySlots.push(slotGroup);
    this.rowSubSlotsMap[uniqueId] = [];
  }

  removeSlot(index: number) {
    const uniqueId = this.availabilitySlots.at(index).get('id')?.value;
    this.availabilitySlots.removeAt(index);
    if (uniqueId) delete this.rowSubSlotsMap[uniqueId];
  }

  generateHourlySlots(uniqueId: string, slotGroup: FormGroup, start: string, end: string) {
    TimeSlotUtil.populateHalfHourSlots(uniqueId, slotGroup, start, end, this.rowSubSlotsMap);
  }

  updateMedicalValidators(role: string) {
    const commonFields = ['medicalRegistrationNo', 'specialization', 'qualification'];

    if (this.medicalRoles.includes(role)) {
      commonFields.forEach((f) =>
        this.newEmployeeForm.get(f)?.setValidators([Validators.required]),
      );
      if (role === 'DOCTOR') {
        this.newEmployeeForm
          .get('consultationFee')
          ?.setValidators([Validators.required, Validators.min(0)]);
        if (this.availabilitySlots.length === 0) this.addSlot();
      } else {
        this.newEmployeeForm.get('consultationFee')?.clearValidators();
      }
    } else {
      commonFields.forEach((f) => this.newEmployeeForm.get(f)?.clearValidators());
      this.newEmployeeForm.get('consultationFee')?.clearValidators();
      while (this.availabilitySlots.length !== 0) this.removeSlot(0);
    }

    commonFields.forEach((f) => this.newEmployeeForm.get(f)?.updateValueAndValidity());
    this.newEmployeeForm.get('consultationFee')?.updateValueAndValidity();
  }

  onSubmitNewEmployee() {
    if (this.newEmployeeForm.invalid) {
      this.newEmployeeForm.markAllAsTouched();
      return;
    }

    this.isSubmittingModal = true;
    this.modalError = null;
    this.cdr.markForCheck();

    const rawValues = this.newEmployeeForm.value;

    const parsedQualifications = rawValues.qualification
      ? rawValues.qualification
          .split(',')
          .map((q: string) => q.trim())
          .filter(Boolean)
      : [];

    const weeklyScheduleMap: { [day: string]: any[] } = {};

    (rawValues.availabilitySlots || []).forEach((slot: any) => {
      if (!slot.dayOfWeek) return;

      const structuralMap = this.rowSubSlotsMap[slot.id] || [];
      const day = slot.dayOfWeek;

      if (!weeklyScheduleMap[day]) {
        weeklyScheduleMap[day] = [];
      }

      structuralMap.forEach((item, subIdx) => {
        if (slot.checkedSlots?.[subIdx]) {
          weeklyScheduleMap[day].push({ startTime: item.startTime, endTime: item.endTime });
        }
      });
    });

    const formattedWeeklySchedule = Object.keys(weeklyScheduleMap).map((day) => ({
      dayOfWeek: day,
      slots: weeklyScheduleMap[day],
    }));

    const payload = {
      ...rawValues,
      role: rawValues.role?.toUpperCase() || '',
      department: rawValues.department?.toUpperCase() || '',
      qualification: parsedQualifications,
      consultationFee: this.isDoctor ? Number(rawValues.consultationFee) : undefined,
      weeklySchedule: this.isDoctor ? formattedWeeklySchedule : [],
    };

    delete payload.availabilitySlots;

    if (this.isEditMode && this.editingEmployeeId) {
      this.apiService.updateEmployee(this.editingEmployeeId, payload).subscribe({
        next: () => {
          this.isSubmittingModal = false;
          alert('Employee updated successfully!');
          this.fetchEmployees();
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmittingModal = false;
          this.modalError = err.error?.message || 'Failed to update employee';
          this.cdr.markForCheck();
        },
      });
    } else {
      this.apiService.createEmployeeByAdmin(payload).subscribe({
        next: () => {
          this.isSubmittingModal = false;
          alert('Employee created successfully!');
          this.fetchEmployees();
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmittingModal = false;
          this.modalError = err.error?.message || 'Failed to create employee';
          this.cdr.markForCheck();
        },
      });
    }
  }
  editEmployee(emp: any) {
    this.isEditMode = true;
    this.editingEmployeeId = emp.employeeCode;

    const formattedDate = emp.joiningDate
      ? new Date(emp.joiningDate).toISOString().split('T')[0]
      : '';
    const qualString = Array.isArray(emp.qualification)
      ? emp.qualification.join(', ')
      : emp.qualification || '';

    this.newEmployeeForm.patchValue({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: this.getRoleString(emp.role).toUpperCase(),
      status: emp.status,
      department: emp.department,
      designation: emp.designation,
      joiningDate: formattedDate,
      medicalRegistrationNo: emp.medicalRegistrationNo || '',
      specialization: emp.specialization || '',
      qualification: qualString,
      consultationFee: emp.consultationFee || null,
    });

    this.showAddModal = true;
    this.cdr.markForCheck();
  }
}
