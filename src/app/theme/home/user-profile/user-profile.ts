import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserEmployeeModel } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfileComponent implements OnInit {
  userService: UserService = inject(UserService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);
  route: Router = inject(Router);
  userData: UserEmployeeModel | null = null;

  ngOnInit() {
    const email = localStorage.getItem('email') ?? '';
    this.userService.getUserProfile(email).subscribe({
      next: (res) => {
        this.userData = res;
        localStorage.setItem('employeeId', this.userData?.employeeId ?? '');
        localStorage.setItem('name', this.userData?.name ?? '');
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });
  }

  // saving email to use it in the update profile
  updateProfile(email: string) {
    localStorage.setItem('updateEmail', email);
    this.route.navigate(['/edit-employee']);
  }

  logout() {
    this.userService.logout();
  }
}
