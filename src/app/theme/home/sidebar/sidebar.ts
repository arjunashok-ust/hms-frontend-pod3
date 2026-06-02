import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { NodeModel } from '../../../models/ui.model';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnInit {
  userService = inject(UserService);
  toast = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  nodeData: NodeModel[] = [];

  ngOnInit(): void {
    const role = JSON.parse(localStorage.getItem('employeeData') || '{}')?.designation || '';

    this.userService.getNodes(role).subscribe({
      next: (res) => {
        this.nodeData = res;
        this.cd.detectChanges();
      },
      error: () => {
        this.toast.error('Error loading sidebar');
      },
    });
  }
}