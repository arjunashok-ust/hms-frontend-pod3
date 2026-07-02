import { Component, inject, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { environment } from '../../../environments';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './approvals.html',
  styleUrls: ['./approvals.css'],
})
export class Approvals implements OnInit {
  employees: any[] = [];
  isLoading = true;

  searchTerm: string = '';
  selectedDepartment: string = '';
  departments: string[] = [];

  currentPage = 1;
  pageSize = environment.pageSize;
  totalRecords = 0;
  totalPages = 1;
  visiblePages: (number | string)[] = [];

  toast: ToastrService = inject(ToastrService);

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchPendingEmployees();
      this.fetchDepartments();
    }
  }

  fetchDepartments() {
    this.apiService.getAllDepartments().subscribe({
      next: (res: any) => {
        this.departments = (res.data || []).map((dept: any) => dept.departmentName);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error('Failed to load departments.');
      },
    });
  }

  fetchPendingEmployees() {
    this.isLoading = true;


    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      status: 'ADMIN_APPROVAL_PENDING'
    };

    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedDepartment) params.department = this.selectedDepartment;

    this.apiService.getAllEmployees(params).subscribe({
      next: (res: any) => {

        this.employees = res.data || [];
        this.totalRecords = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 1;

        this.generatePagesArray();
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


  generatePagesArray() {
    const total = this.totalPages;
    const currentlyShowing = this.currentPage;

    if (total <= 6) {
      this.visiblePages = Array.from({ length: total }, (_, num) => num + 1);
      return;
    }

    if (currentlyShowing <= 3) {
      this.visiblePages = [1, 2, 3, 4, '...', total];
    } else if (currentlyShowing >= total - 2) {
      this.visiblePages = [1, '...', total - 3, total - 2, total - 1, total];
    } else {
      this.visiblePages = [1, '...', currentlyShowing - 1, currentlyShowing, currentlyShowing + 1, '...', total];
    }
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchPendingEmployees();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchPendingEmployees();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchPendingEmployees();
    }
  }

  applyFilters() {
    this.currentPage = 1;
    this.fetchPendingEmployees();
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

          if (this.employees.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
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

          if (this.employees.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.fetchPendingEmployees();
        },
        error: (err) => {
          this.toast.error('Error rejecting employee: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }
}