import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.error instanceof ErrorEvent
          ? `Erreur client : ${error.error.message}`
          : error.error?.message || error.error?.error || `Erreur serveur (${error.status})`;

      return throwError(() => ({ status: error.status, message }));
    }),
  );
