import { CommonModule } from '@angular/common';

import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Auth } from '../services/auth';
import { NotificationService } from '../services/notification';

import { Router } from '@angular/router';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';

@Component({
  selector: 'app-user',

  standalone: true,

  imports: [CommonModule, FormsModule, HasPermissionDirective],

  templateUrl: './user.html',

  styleUrl: './user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User implements OnInit {
  /* EXPOSED FOR TEMPLATE *hasPermission CHECKS */
  readonly PERMISSIONS = PERMISSIONS;

  user: any = {};

  loading = true;

  isEditMode = false;

  editForm: any = {
    name: '',
    phone: '',
    department: '',
    designation: '',
    specialization: '',
    consultationFee: '',
  };

  constructor(
    readonly auth: Auth,

    readonly cd: ChangeDetectorRef,

    readonly router: Router,

    readonly notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  /* LOAD PROFILE */

  loadProfile() {
    if (globalThis.window) {
      const token = localStorage.getItem('token');

      if (token) {
        this.auth.getCurrentUser().subscribe({
          next: (response: any) => {
            console.log(response);

            /* USER DATA */

            this.user = response.data;

            this.loading = false;

            this.cd.markForCheck();
          },

          error: (err: any) => {
            console.log(err);

            this.loading = false;

            this.cd.markForCheck();
          },
        });
      }
    }
  }

  /* USER INITIAL */

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  /* FORMAT DATE */

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleDateString(
      'en-IN',

      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  }

  /* LOGOUT */

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  /* EDIT PROFILE */

  enterEditMode() {
    this.editForm = {
      name: this.user?.name || '',
      phone: this.user?.phone || '',
      department: this.user?.department || '',
      designation: this.user?.designation || '',
      specialization: this.user?.specialization || '',
      consultationFee: this.user?.consultationFee || '',
    };

    this.isEditMode = true;
  }

  cancelEditMode() {
    this.isEditMode = false;
  }

  saveProfile() {
    this.auth.updateProfile(this.user.id, this.editForm).subscribe({
      next: (response: any) => {
        this.notify.success(response.message || 'Profile updated successfully');
        this.isEditMode = false;
        this.loadProfile();
        this.cd.markForCheck();
      },

      error: (err: any) => {
        this.notify.error(err?.error?.message || 'Unable To Update Profile');
        this.cd.markForCheck();
      },
    });
  }
}
