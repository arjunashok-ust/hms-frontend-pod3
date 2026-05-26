import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserModel } from '../../../models/user.model';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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

  userData: UserModel | null = null;

  ngOnInit() {
    const email = localStorage.getItem('email') ?? '';
    this.userService.getUserProfile(email).subscribe({
      next: (res) => {
        this.userData = res;
        localStorage.setItem('role', this.userData?.role ?? '');
        localStorage.setItem('employeeId', this.userData?.employeeCode ?? '');
        localStorage.setItem('name', this.userData?.name ?? '');
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err.message);
      },
    });
  }

  logout() {
    this.userService.logout();
  }
}
