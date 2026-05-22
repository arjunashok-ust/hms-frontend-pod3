import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserModel } from '../../../models/user.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfileComponent implements OnInit {
  userService : UserService = inject(UserService);
  userData : UserModel | null = null;
  activatedRoute : ActivatedRoute = inject(ActivatedRoute);
  cd : ChangeDetectorRef = inject(ChangeDetectorRef);

  ngOnInit(){
    const email = localStorage.getItem('email') ?? '';
    this.userService.getUserProfile(email).subscribe({
      next: (res) => {
        this.userData = res;
        localStorage.setItem('role',this.userData?.role ?? '');
        localStorage.setItem('employeeId',this.userData?.employeeId ?? '');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err.message);
      }
    });
  }
}
