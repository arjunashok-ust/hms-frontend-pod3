import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/apiService/api-service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
    selector: 'app-department-management',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        HasPermissionDirective,
    ],
    templateUrl: './department-management.html',
    styleUrls: ['./department-management.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentManagementComponent implements OnInit {
    departments: any[] = [];
    isLoading = true;
    isSaving = false;

    departmentForm: FormGroup;
    editingDepartmentId: string | null = null;

    private readonly apiService = inject(ApiService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly toast = inject(ToastrService);
    private readonly fb = inject(FormBuilder);

    constructor() {
        this.departmentForm = this.fb.group({
            departmentName: ['', [Validators.required, Validators.minLength(2)]],
        });
    }

    ngOnInit(): void {
        this.fetchDepartments();
    }

    fetchDepartments(): void {
        this.isLoading = true;
        this.apiService.getAllDepartments().subscribe({
            next: (res) => {
                this.departments = res.data || [];
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.toast.error('Failed to load departments.');
                console.error(err);
                this.isLoading = false;
                this.cdr.markForCheck();
            },
        });
    }

    startEdit(department: any): void {
        this.editingDepartmentId = department.departmentId;
        this.departmentForm.setValue({ departmentName: department.departmentName });
    }

    cancelEdit(): void {
        this.editingDepartmentId = null;
        this.departmentForm.reset();
    }

    handleFormSubmit(): void {
        if (this.departmentForm.invalid) {
            this.toast.warning('Please provide a valid department name.');
            return;
        }

        this.isSaving = true;
        const departmentName = this.departmentForm.value.departmentName.toUpperCase();

        if (this.editingDepartmentId) {
            // Update existing department
            this.apiService.updateDepartment(this.editingDepartmentId, { departmentName }).subscribe({
                next: () => {
                    this.toast.success('Department updated successfully!');
                    this.finishSave();
                },
                error: (err) => {
                    this.toast.error(err.error?.message || 'Failed to update department.');
                    this.isSaving = false;
                    this.cdr.markForCheck();
                },
            });
        } else {
            // Create new department
            this.apiService.createDepartment({ departmentName }).subscribe({
                next: () => {
                    this.toast.success('Department created successfully!');
                    this.finishSave();
                },
                error: (err) => {
                    this.toast.error(err.error?.message || 'Failed to create department.');
                    this.isSaving = false;
                    this.cdr.markForCheck();
                },
            });
        }
    }

    private finishSave(): void {
        this.isSaving = false;
        this.cancelEdit();
        this.fetchDepartments();
    }

    deleteDepartment(departmentId: string, departmentName: string): void {
        if (confirm(`Are you sure you want to delete the "${departmentName}" department? This action cannot be undone.`)) {
            this.apiService.deleteDepartment(departmentId).subscribe({
                next: () => {
                    this.toast.success('Department deleted successfully!');
                    this.fetchDepartments();
                },
                error: (err) => {
                    this.toast.error(err.error?.message || 'Failed to delete department.');
                },
            });
        }
    }

    getInitials(name: string): string {
        if (!name) return 'D';
        return name.substring(0, 2).toUpperCase();
    }
}