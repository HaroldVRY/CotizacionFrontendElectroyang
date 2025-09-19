// src/app/core/services/request-handler.service.ts

import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { finalize, catchError, Observable, throwError } from 'rxjs';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class RequestHandlerService {

  constructor(
    private loading: LoadingService,
    private message: MessageService
  ) { }

  handle<T>(obs$: Observable<T>): Observable<T> {
    this.loading.show();

    return obs$.pipe(
      finalize(() => this.loading.hide()),
      catchError((error) => {
        // Extraer el mensaje de error de diferentes fuentes posibles
        let message = 'Ocurrió un error inesperado';

        // Primero intentar obtener el mensaje del cuerpo de la respuesta de error
        if (error?.error?.mensajeAviso) {
          message = error.error.mensajeAviso;
        } else if (error?.error?.message) {
          message = error.error.message;
        } else if (error?.error?.detail) {
          message = error.error.detail;
        } else if (error?.mensajeAviso) {
          message = error.mensajeAviso;
        } else if (error?.message) {
          message = error.message;
        } else if (error?.error && typeof error.error === 'string') {
          message = error.error;
        } else if (error?.status) {
          // Manejar diferentes códigos de estado HTTP
          switch (error.status) {
            case 400:
              message = error?.error?.mensajeAviso || error?.error?.message || 'Solicitud incorrecta - verifique los datos enviados';
              break;
            case 401:
              message = 'No autorizado - su sesión puede haber expirado';
              break;
            case 403:
              message = 'Acceso denegado - no tiene permisos para esta operación';
              break;
            case 404:
              message = 'Recurso no encontrado';
              break;
            case 500:
              message = 'Error interno del servidor';
              break;
            case 503:
              message = 'Servicio no disponible temporalmente';
              break;
            default:
              message = `Error ${error.status}: ${error.statusText || 'Error del servidor'}`;
          }
        }

        this.message.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
          life: 5000 // El mensaje se cierra automáticamente después de 5 segundos
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, summary: string = 'Éxito'): void {
    this.message.add({
      severity: 'success',
      summary,
      detail: message,
      life: 3000
    });
  }

  /**
   * Muestra un mensaje de información
   */
  showInfo(message: string, summary: string = 'Información'): void {
    this.message.add({
      severity: 'info',
      summary,
      detail: message,
      life: 3000
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  showWarning(message: string, summary: string = 'Advertencia'): void {
    this.message.add({
      severity: 'warn',
      summary,
      detail: message,
      life: 4000
    });
  }
}
