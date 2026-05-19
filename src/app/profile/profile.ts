import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UserModel } from '../models/user/user.model';
import { UserService } from '../service/user/user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.htm',
  styleUrl: './profile.css',
  standalone: true,
  imports: [CommonModule],
})
export class ProfileComponent implements OnInit {
  userService: UserService = inject(UserService);
  savedRoute: ActivatedRoute = inject(ActivatedRoute);
  route: Router = inject(Router);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  user: UserModel = {
    name: '',
    email: '',
    designation: '',
    employeeId: '',
    status: '',
    roles: '',
    lastLoginAt: '',
  };

  ngOnInit(): void {
    this.savedRoute.queryParams.subscribe((params) => {
      let email = params['email'];
      if (!email) {
        this.route.navigate(['/login']);
        return;
      }
      
      this.userService.getUserProfile(email || '').subscribe({
        next: (res) => {
          console.log(res);
          this.user = res;
          this.cd.detectChanges();
        },
        error: (error) => {
          console.log(error);
        },
      });
    });
  }
}
