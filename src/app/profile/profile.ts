import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.htm',
  styleUrl: './profile.css',
  standalone: true,
  imports: [CommonModule],
})
export class ProfileComponent {
  user: UserData = new UserData();
}

class UserData {
  employeeId: string = 'EMP-000001';
  name: string = 'John Doe';
  email: string = 'johndoe@hms.com';
  roles: string[] = ['Owner', 'Doctor'];
  department: string = 'OCD';
  joiningDate: string = '12/03/2023';
  medicalRegistrationNo: string = 'MED12345';
}
