import {

  CommonModule

} from "@angular/common";

import {

  Component,
  OnInit,
  ChangeDetectorRef

} from "@angular/core";

import { Auth } from "../services/auth";

import { Router } from "@angular/router";

@Component({

  selector: "app-user",

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: "./user.html",

  styleUrl: "./user.css",

})

export class User implements OnInit {

  user:any = {};

  loading = true;

  constructor(

    readonly auth:Auth,

    readonly cd:ChangeDetectorRef,

    readonly router:Router

  ) {}

  ngOnInit(): void {

    this.loadProfile();

  }

  /* LOAD PROFILE */

  loadProfile(){

    if (globalThis.window) {

      const token =

        localStorage.getItem(
          'token'
        );

      if(token){

        this.auth.getCurrentUser()
        .subscribe({

          next:(response:any)=>{

            console.log(response);

            /* USER DATA */

            this.user =

              response.user ||
              response;

            this.loading = false;

            this.cd.detectChanges();

          },

          error:(err:any)=>{

            console.log(err);

            this.loading = false;

            this.cd.detectChanges();

          }

        });

      }

    }

  }

  /* USER INITIAL */

  getInitial(name:string):string{

    return name

      ? name.charAt(0)
        .toUpperCase()

      : '?';

  }

  /* FORMAT DATE */

  formatDate(date:string):string{

    if(!date){

      return '—';

    }

    return new Date(date)
    .toLocaleDateString(

      'en-IN',

      {

        day:'2-digit',
        month:'short',
        year:'numeric'

      }

    );

  }

  /* LOGOUT */

  logout(){

    localStorage.removeItem('token');
    localStorage.removeItem('role');

    this.router.navigate(['/login']);

  }

}