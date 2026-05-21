import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from "@angular/router";
import { UserService } from '../../../services/user.service';
import { NodeModel } from '../../../models/ui.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink,RouterModule,CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnInit{
  userService : UserService = inject(UserService);
  nodeData : NodeModel[] | null = null;
  cd : ChangeDetectorRef = inject(ChangeDetectorRef);
  ngOnInit() {
    const role = localStorage.getItem('role')??'';
    console.log(role);
    this.userService.getNodes(role).subscribe({
      next: (res) =>{
        this.nodeData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
      }
    })
  }
}
