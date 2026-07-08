import { Component, inject, OnInit, signal } from '@angular/core';
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
  userService: UserService = inject(UserService);
  toast: ToastrService = inject(ToastrService);
  nodeData = signal<NodeModel[] | null>(null);

  ngOnInit() {
    const role = localStorage.getItem('role') ?? '';
    this.userService.getNodes(role).subscribe({
      next: (res) => {
        this.nodeData.set(res);
      },
      error: (err) => {
        this.toast.error(err.error.message);
      },
    });
  }
}
