/**
 * @file employee.ts
 * @description
 * This file defines the component for managing employee records.
 *
 * @overview
 * This is a comprehensive component for the full lifecycle management of employees.
 * It allows administrators to view, filter, search, create, update, and delete employee records.
 * It features a complex reactive form within a modal for adding and editing employees, including dynamic fields for medical roles and their availability schedules.
 *
 * Connections:
 *   User Interaction -> EMPLOYEE.TS -> ApiService -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { TimeSlotUtil, GeneratedSlot } from '../../utils/timeSlot';
import {
  joiningDateValidator,
  getMinDate,
  getMaxDate
} from '../../utils/joiningDateValidator';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { environment } from '../../../environments';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './employee.html',
  styleUrls: ['./employee.css'],
})
export class Employee implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  isLoading = true;
  showPendingApprovals = false;
  pendingCount = 0;

  stats = {
    pending: 0,
    verified: 0,
    inactive: 0,
    firstLogin: 0,
    total: 0
  };

  currentPage = 1;
  pageSize = environment.pageSize;
  totalRecords = 0;
  totalPages = 1;
  visiblePages: (number | string)[] = [];

  searchTerm: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  departments: string[] = [];

  showAddModal = false;
  isSubmittingModal = false;
  modalError: string | null = null;
  newEmployeeForm!: FormGroup;

  userPermissions: string[] = [];

  medicalRoles: string[] = [];

  baseRoles: { value: string, label: string }[] = [];
  availableRoles: any[] = [];

  rowSubSlotsMap: { [uniqueId: string]: GeneratedSlot[] } = {};
  availableHours: string[] = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, '0')}:00`,
  );

  isEditMode = false;
  editingEmployeeId: string | null = null;
  toast: ToastrService = inject(ToastrService);

  private readonly phonePattern = /^(\+91[\s-]?)?[6789]\d{9}$/;

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly elementRef: ElementRef
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.fetchAndSetupRoles();
    this.fetchDepartments();

    this.route.data.subscribe(data => {
      if (data['openApprovalsByDefault']) {
        this.showPendingApprovals = true;
        this.selectedStatus = '';
      } else {
        this.showPendingApprovals = false;
        this.selectedStatus = '';
      }
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  fetchDepartments() {
    this.apiService.getAllDepartments().subscribe({
      next: (res: any) => {
        this.departments = (res.data || []).map((d: any) => d.departmentName);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error("Failed to load departments.");
      }
    })
  }

  fetchAndSetupRoles() {
    this.apiService.getAllRoles().subscribe({
      next: (res: any) => {
        const allRoles = res.data || [];

        this.medicalRoles = allRoles
          .filter((r: any) => r.isMedicalRole)
          .map((r: any) => r.roleName.toUpperCase());

        this.baseRoles = allRoles.map((r: any) => ({
          value: r.roleName.toUpperCase(),
          label: this.formatRoleLabel(r.roleName)
        }));

        this.setupAvailableRoles();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error("Failed to load roles from server.");
        console.error(err);
      }
    });
  }

  setupAvailableRoles() {
    if (!isPlatformBrowser(this.platformId)) {
      this.availableRoles = [...this.baseRoles];
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.availableRoles = [...this.baseRoles];
      return;
    }

    try {
      const payload = this.decodeTokenPayload(token);
      this.userPermissions = payload.permissions || [];
      this.availableRoles = this.getAvailableRoles();
    } catch (err) {
      console.error(err);
      this.availableRoles = [...this.baseRoles];
    }
  }

  private decodeTokenPayload(token: string): any {
    const encodedPayload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    return JSON.parse(atob(encodedPayload));
  }

  private getAvailableRoles(): any[] {
    if (!this.userPermissions.includes('CREATE_ADMIN')) {
      return [...this.baseRoles];
    }

    const adminRoleExists = this.baseRoles.some((role) => role.value === 'ADMIN');
    if (adminRoleExists) {
      return [...this.baseRoles];
    }

    return [{ value: 'ADMIN', label: 'Admin' }, ...this.baseRoles];
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent): void {
    const modalOverlay = this.elementRef.nativeElement.querySelector('.modal-overlay');
    if (this.showAddModal && event.target === modalOverlay) {
      this.closeModal();
    }
  }

  canEditEmployee(emp: any): boolean {
    const role = this.getRoleString(emp.role).toUpperCase();
    if (role === 'ADMIN') {
      return this.userPermissions.includes('UPDATE_ADMIN');
    }
    return this.userPermissions.includes('UPDATE_EMPLOYEE');
  }

  canDeleteEmployee(emp: any): boolean {
    const role = this.getRoleString(emp.role).toUpperCase();
    if (role === 'ADMIN') {
      return this.userPermissions.includes('DELETE_ADMIN');
    }
    return this.userPermissions.includes('DELETE_EMPLOYEE');
  }

  minDate = getMinDate();
  maxDate = getMaxDate();

  fetchEmployees() {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedDepartment) params.department = this.selectedDepartment;

    if (this.showPendingApprovals) {
      params.status = 'ADMIN_APPROVAL_PENDING';
    } else if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    this.apiService.getAllEmployees(params).subscribe({
      next: (res: any) => {
        this.filteredEmployees = res.data || [];
        this.totalRecords = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 1;

        if (res.stats) {
          this.stats = res.stats;
          this.pendingCount = this.stats.pending;
        }

        this.generatePagesArray();
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching employees', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  generatePagesArray() {
    const total = this.totalPages;
    const thisPage = this.currentPage;

    if (total <= 6) {
      this.visiblePages = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    if (thisPage <= 3) {
      this.visiblePages = [1, 2, 3, 4, '...', total];
    } else if (thisPage >= total - 2) {
      this.visiblePages = [1, '...', total - 3, total - 2, total - 1, total];
    } else {
      this.visiblePages = [1, '...', thisPage - 1, thisPage, thisPage + 1, '...', total];
    }
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchEmployees();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchEmployees();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchEmployees();
    }
  }

  filterByCard(statusType: string) {
    if (statusType === 'PENDING') {
      this.showPendingApprovals = true;
      this.selectedStatus = '';
    } else {
      this.showPendingApprovals = false;
      this.selectedStatus = statusType;
    }
    this.applyFilters();
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
    this.currentPage = 1;
    this.fetchEmployees();
  }

  timeRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const start = control.get('startTime')?.value;
    const end = control.get('endTime')?.value;
    if (start && end && start >= end) {
      return { timeRangeInvalid: true };
    }
    return null;
  }

  getRoleString(role: any): string {
    if (!role) return 'Staff';
    return Array.isArray(role) ? role[0] : String(role);
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  }

  deleteEmployee(id: string) {
    if (confirm(`Are you absolutely sure you want to delete employee ${id}? This cannot be undone.`)) {
      this.apiService.deleteEmployee(id).subscribe({
        next: () => {
          this.toast.success('Employee deleted successfully.');
          this.fetchEmployees();
        },
        error: (err) => {
          this.toast.error('Error deleting employee: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }

  initForm() {
    this.newEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      role: ['', Validators.required],
      status: ['ACTIVE', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      joiningDate: ['', [Validators.required, joiningDateValidator]],
      medicalRegistrationNo: [''],
      specialization: [''],
      qualification: ['', Validators.required],
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
      dayOfWeek: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      checkedSlots: this.fb.array([]),
    }, {
      validators: this.timeRangeValidator
    });

    slotGroup.valueChanges.subscribe((changes) => {
      if (slotGroup.hasError('timeRangeInvalid')) {
        this.rowSubSlotsMap[uniqueId] = [];
        const checkedArray = slotGroup.get('checkedSlots') as FormArray;
        while (checkedArray.length !== 0) checkedArray.removeAt(0);
      } else if (changes.startTime && changes.endTime) {
        this.generateHourlySlots(uniqueId, slotGroup, changes.startTime, changes.endTime);
      }
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

  formatRoleLabel(roleName: string): string {
    if (!roleName) return '';
    return roleName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
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
          this.toast.success('Employee updated successfully!');
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
          this.toast.success('Employee created successfully!');
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