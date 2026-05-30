import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage: string;

      if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
      
      console.error('Error Interceptor caught:', errorMessage);
      return throwError(() => error);
    })
  );
};