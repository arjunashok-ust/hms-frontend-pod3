import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee.html'
})
export class EmployeesComponent implements OnInit {

  employees: any[] = [];   // ✅ stores employee list
  loading: boolean = true; // ✅ for loader

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        console.log("Employees API Response:", res);

        // ✅ handle backend response correctly
        this.employees = res.data || res;

        this.loading = false;
      },
      error: (err: any) => {
        console.error("Error fetching employees:", err);
        this.loading = false;
      }
    });
  }
}