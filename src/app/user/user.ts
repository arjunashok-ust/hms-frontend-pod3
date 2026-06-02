import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.html',
  styleUrl: './user.css'
})

export class UserComponent implements OnInit {

  user: any = null;

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      this.getProfile();

    }

  }

  getProfile() {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({

      Authorization: `Bearer ${token}`

    });

    this.http.get(
      'http://localhost:3000/api/auth/profile',
      { headers }
    ).subscribe({

      next: (response: any) => {

        console.log(response);

        this.user = response.user;

        this.cd.detectChanges();

      },

      error: (error) => {

        console.log(error);

      }

    });

  }

}