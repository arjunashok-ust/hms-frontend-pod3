import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { UserModel } from '../models/user/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  http: HttpClient = inject(HttpClient);
  api = new ApiUrl();

  // get user profile
  getUserProfile(email: string) : Observable<any> {
    return this.http
      .get<UserModel>(`${this.api.backend_url}/user/getUserProfile`, {
        params: {
          email: email,
        },
      })
      .pipe(catchError(this.handleError));
  }

  handleError(err: HttpErrorResponse) {
    let message = 'Unexpected error happend!';
    if (err.error?.message) {
      message = err.error.message;
    }

    return throwError(() => new Error(message));
  }
}
