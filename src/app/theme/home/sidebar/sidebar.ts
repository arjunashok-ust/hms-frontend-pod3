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
  userService: UserService = inject(UserService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  nodeData: NodeModel[] | null = null;

  ngOnInit() {
    const role = localStorage.getItem('role') ?? '';
    this.userService.getNodes(role).subscribe({
      next: (res) => {
        this.nodeData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err.message);
      },
    });
  }
}
