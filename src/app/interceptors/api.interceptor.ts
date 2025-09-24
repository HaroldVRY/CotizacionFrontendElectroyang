import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { UsuarioService } from '../service/usuario.service';
import { Router } from '@angular/router';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clonar la request para agregar headers
    let apiReq = req;

    // Agregar headers comunes
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Agregar token de autenticación si existe
    const token = this.usuarioService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Aplicar headers a la request
    apiReq = req.clone({
      setHeaders: headers
    });

    // Procesar la request con manejo de errores
    return next.handle(apiReq).pipe(
      // Retry automático para errores de red (máximo 1 retry)
      retry({
        count: 1,
        delay: (error: HttpErrorResponse) => {
          // Solo reintentar para errores de red (5xx) o timeout
          if (error.status >= 500 || error.status === 0) {
            return throwError(() => error);
          }
          // Para otros errores, no reintentar
          return throwError(() => error);
        }
      }),
      // Manejo global de errores
      catchError((error: HttpErrorResponse) => {
        console.error('Error en petición HTTP:', error);

        // Manejar errores de autenticación
        if (error.status === 401) {
          // Token expirado o inválido
          this.usuarioService.logout().subscribe({
            complete: () => {
              this.router.navigate(['/login']);
            }
          });
        }

        // Manejar errores de autorización
        if (error.status === 403) {
          this.router.navigate(['/unauthorized']);
        }

        // Para otros errores, propagarlos
        return throwError(() => error);
      })
    );
  }
}
