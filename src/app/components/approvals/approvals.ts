import { Component, inject, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './approvals.html',
  styleUrls: ['./approvals.css'],
})
export class Approvals implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  isLoading = true;

  searchTerm: string = '';
  selectedDepartment: string = '';
  departments = ["OPD", "IPD", "ADMIN", "LAB", "PHARMACY"];

  toast: ToastrService = inject(ToastrService);

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchPendingEmployees();
    }
  }

  fetchPendingEmployees() {
    this.apiService.getAllEmployees().subscribe({
      next: (data: any) => {
        if (!Array.isArray(data)) {
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        this.employees = data.filter((e: any) => e.status === 'ADMIN_APPROVAL_PENDING');
        this.applyFilters();

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching queue', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters() {
    this.filteredEmployees = this.employees.filter((emp) => {
      const matchesSearch = !this.searchTerm ||
        emp.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesDept = !this.selectedDepartment || emp.department === this.selectedDepartment;

      return matchesSearch && matchesDept;
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
        next: () => {
          this.toast.success('Employee approved successfully!');
          this.fetchPendingEmployees();
        },
        error: (err) => {
          this.toast.error('Error approving employee: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }

  rejectEmployee(emp: any) {
    if (confirm(`Reject account for ${emp.name}?`)) {
      this.apiService.rejectEmployee(emp.employeeCode).subscribe({
        next: () => {
          this.toast.success('Employee rejected successfully!');
          this.fetchPendingEmployees();
        },
        error: (err) => {
          this.toast.error('Error rejecting employee: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }
}