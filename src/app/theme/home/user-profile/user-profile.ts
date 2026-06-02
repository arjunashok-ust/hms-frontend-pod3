import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserEmployeeModel } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfileComponent implements OnInit {

  userService = inject(UserService);
  toast = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  userData: UserEmployeeModel | null = null;

  ngOnInit(): void {
    this.userService.getUserProfile().subscribe({
      next: (res) => {
        this.userData = res;
        this.cd.detectChanges();
        localStorage.setItem('employeeId', res?.employeeId || '');
        localStorage.setItem('name', res?.name || '');
      },
      error: () => {
        this.toast.error('Failed to load profile');
      },
    });
  }

  logout(): void {
    this.userService.logout();
  }
}
