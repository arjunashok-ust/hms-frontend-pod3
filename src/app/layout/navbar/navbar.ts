import {
  Component,
  OnInit,
  inject,
  PLATFORM_ID
} from '@angular/core';

import { CommonModule, isPlatformBrowser }
from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})

export class NavbarComponent implements OnInit {

  user: any;

  platformId = inject(PLATFORM_ID);

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      const storedUser =
        localStorage.getItem('user');

      if (storedUser) {

        this.user = JSON.parse(storedUser);

      }

    }

  }

  logout() {

    if (isPlatformBrowser(this.platformId)) {

      localStorage.clear();

      window.location.href = '/login';

    }

  }

}