import {

  Component,

  OnInit

} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { ChangeDetectorRef } from '@angular/core';
@Component({

  selector: 'app-employee',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './employee.html',

  styleUrl: './employee.css'

})

export class Employee implements OnInit {

  /* EMPLOYEE TABLE */

  employeeData: any[] = [];

  filteredEmployeeData: any[] = [];

  departments: string[] = [];

  /* FILTERS */

  selectedText = '';

  selectedDepartment = '';

  selectedStatus = '';

  /* MODAL */

  showModal = false;

  /* ALERTS */

  errorMessage = '';

  successMessage = '';

  /* SLOT DATA */

  hours: number[] =

    Array.from(
      { length: 24 },
      (_, i) => i
    );

  generatedSlots: string[] = [];

  /* FORM */

  employeeForm: any = {

    email: '',

    name: '',

    role: '',

    phone: '',

    department: '',

    designation: '',

    status: true,

    joiningDate: '',

    specialization: '',

    medicalRegistrationNo: '',

    qualification: '',

    consultationFee: '',

    startHour: '',

    endHour: '',

    availabilitySlots: []

  };

  constructor(private auth: Auth,private cd:ChangeDetectorRef) { }

  ngOnInit(): void {

  if(typeof window !== 'undefined'){

    const token =
      localStorage.getItem('token');

    console.log(token);

    if(token){

      this.loadEmployees();

    }

  }

}

  /* LOAD EMPLOYEES */

  loadEmployees(){

  console.log(
    localStorage.getItem('token')
  );

  this.auth.getEmployees().subscribe({

    next:(response:any)=>{

      console.log(response);

      this.employeeData = response;

      this.filteredEmployeeData =
        response;

      this.departments = Array.from(

        new Set(

          response.map(

            (emp:any)=>

              String(emp.department)

          )

        )

      );
        this.cd.detectChanges();

    },

    error:(err:any)=>{

      console.log(err);

    }

  });

}

  /* FILTERS */

  applyFilters() {

    this.filteredEmployeeData =

      this.employeeData.filter(

        (employee: any) => {

          const searchMatch =

            employee.name
              ?.toLowerCase()
              .includes(
                this.selectedText
                  .toLowerCase()
              )

            ||

            employee.email
              ?.toLowerCase()
              .includes(
                this.selectedText
                  .toLowerCase()
              )

            ||

            employee.employeeId
              ?.toLowerCase()
              .includes(
                this.selectedText
                  .toLowerCase()
              );

          const departmentMatch =

            !this.selectedDepartment ||

            employee.department ===
            this.selectedDepartment;

          const statusMatch =

            !this.selectedStatus ||

            String(employee.status) ===
            this.selectedStatus;

          return (

            searchMatch &&
            departmentMatch &&
            statusMatch

          );

        }

      );

  }

  /* OPEN MODAL */

  openModal() {

    this.showModal = true;

  }

  /* CLOSE MODAL */

  closeModal() {

    this.showModal = false;

    this.errorMessage = '';

    this.successMessage = '';

  }

  /* GENERATE TIME SLOTS */

  generateTimeSlots() {

    this.errorMessage = '';

    const startHour =

      Number(
        this.employeeForm.startHour
      );

    const endHour =

      Number(
        this.employeeForm.endHour
      );

    if (

      startHour >= endHour

    ) {

      this.errorMessage =

        'Start hour must be less than end hour';

      return;

    }

    this.generatedSlots = [];

    for (

      let i = startHour;

      i < endHour;

      i++

    ) {

      this.generatedSlots.push(

        `${this.formatHour(i)} - ${this.formatHourHalf(i)}`,

        `${this.formatHourHalf(i)} - ${this.formatHour(i + 1)}`

      );

    }

  }

  /* TOGGLE SLOT */

  toggleSlot(slot: string) {

    const existingIndex =

      this.employeeForm
        .availabilitySlots
        .indexOf(slot);

    if (existingIndex > -1) {

      this.employeeForm
        .availabilitySlots
        .splice(existingIndex, 1);

    }

    else {

      this.employeeForm
        .availabilitySlots
        .push(slot);

    }

  }

  /* CHECK SLOT */

  isSlotSelected(slot: string) {

    return this.employeeForm
      .availabilitySlots
      .includes(slot);

  }

  /* FORMAT FULL HOUR */

  formatHour(hour: number) {

    const period =

      hour >= 12
        ? 'PM'
        : 'AM';

    const formattedHour =

      hour % 12 || 12;

    return `${formattedHour}:00 ${period}`;

  }

  /* FORMAT HALF HOUR */

  formatHourHalf(hour: number) {

    const period =

      hour >= 12
        ? 'PM'
        : 'AM';

    const formattedHour =

      hour % 12 || 12;

    return `${formattedHour}:30 ${period}`;

  }

  /* ADD EMPLOYEE */

  addEmployee(form: any) {

    this.errorMessage = '';

    this.successMessage = '';

    if (form.invalid) {

      this.errorMessage =

        'Please fill all required fields';

      return;

    }

    console.log(this.employeeForm);

    this.auth.adminSignup(

      this.employeeForm

    ).subscribe({

      next: (response: any) => {

        console.log(response);

        this.successMessage =

          response.message;

        this.loadEmployees();

        form.resetForm();

        /* RESET FORM */

        this.employeeForm = {

          email: '',

          name: '',

          role: '',

          phone: '',

          department: '',

          designation: '',

          status: true,

          joiningDate: '',

          specialization: '',

          medicalRegistrationNo: '',

          qualification: '',

          consultationFee: '',

          startHour: '',

          endHour: '',

          availabilitySlots: []

        };

        this.generatedSlots = [];

        setTimeout(() => {

          this.closeModal();

        }, 1500);

      },

      error: (err: any) => {

        console.log(err);

        console.log(err.error);

        if (err?.error?.errors) {

          this.errorMessage =

            err.error.errors
              .map(
                (e: any) => e.msg
              )
              .join(', ');

        }

        else {

          this.errorMessage =

            err?.error?.message ||

            'Unable To Create Employee';

        }

      }

    });

  }

  /* DELETE EMPLOYEE */

  deleteEmployee(employeeId: string) {

    this.auth.deleteEmployee(

      employeeId

    ).subscribe({

      next: (response: any) => {

        alert(

          'Employee Deleted Successfully'

        );

        this.employeeData =

          this.employeeData.filter(

            (employee: any) =>

              employee.employeeId !==
              employeeId

          );

        this.applyFilters();

      },

      error: (err: any) => {

        console.log(err);

        alert(

          'Unable To Delete Employee'

        );

      }

    });

  }

}