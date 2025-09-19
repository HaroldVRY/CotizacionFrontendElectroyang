import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { DialogoComponent } from '../components/dialogo/dialogo.component';

export interface DialogConfig {
  header?: string;
  width?: string;
  height?: string;
  modal?: boolean;
  closable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  baseZIndex?: number;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CustomDialogService {

  constructor(private dialogService: DialogService) { }

  /**
   * Abre un diálogo dinámico con el componente especificado
   * @param component - El componente a mostrar en el diálogo
   * @param config - Configuración del diálogo
   * @returns Observable con el resultado del diálogo
   */
  open(component: any, config: DialogConfig = {}): Observable<any> {
    const defaultConfig = {
      modal: true,
      closable: true,
      draggable: false,
      resizable: false,
      maximizable: false,
      baseZIndex: 10000,
      width: '600px',
      ...config
    };

    const ref = this.dialogService.open(component, defaultConfig);
    return ref.onClose;
  }

  /**
   * Muestra un diálogo de mensaje simple
   * @param mensaje - El mensaje a mostrar
   * @param severidad - Tipo de mensaje (info, success, warn, error)
   * @param header - Título del diálogo
   * @returns Observable con el resultado del diálogo
   */
  showMessage(mensaje: string, severidad: 'info' | 'success' | 'warn' | 'error' = 'info', header?: string): Observable<any> {
    return this.open(DialogoComponent, {
      header: header || this.getDefaultHeader(severidad),
      width: '400px',
      data: {
        mensaje,
        severidad,
        mostrarBotones: false
      }
    });
  }

  /**
   * Muestra un diálogo de confirmación
   * @param mensaje - El mensaje de confirmación
   * @param header - Título del diálogo
   * @param labelAceptar - Texto del botón de aceptar
   * @param labelCerrar - Texto del botón de cancelar
   * @returns Observable con el resultado ('aceptar' o 'cerrar')
   */
  showConfirmation(
    mensaje: string,
    header: string = 'Confirmación',
    labelAceptar: string = 'Aceptar',
    labelCerrar: string = 'Cancelar'
  ): Observable<any> {
    return this.open(DialogoComponent, {
      header,
      width: '450px',
      data: {
        mensaje,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar,
        labelCerrar
      }
    });
  }

  /**
   * Obtiene el header predeterminado según la severidad
   */
  private getDefaultHeader(severidad: string): string {
    switch (severidad) {
      case 'error':
        return 'Error';
      case 'warn':
        return 'Advertencia';
      case 'success':
        return 'Éxito';
      default:
        return 'Información';
    }
  }
}
