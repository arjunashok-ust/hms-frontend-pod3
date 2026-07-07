/**
 * @file error-interceptor.ts
 * @description
 * This file defines a basic HTTP interceptor for logging errors.
 *
 * @overview
 * This interceptor catches any HTTP errors that occur during a request.
 * It logs a formatted error message to the console and then re-throws the error to be handled by the subscriber in the service or component.
 *
 * Connections:
 *   HttpClient -> [authInterceptor] -> ERROR-INTERCEPTOR.TS -> Backend API
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage: string;

      if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        console.log(error);
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }

      console.error('Error Interceptor caught:', errorMessage);
      return throwError(() => error);
    }),
  );
};
