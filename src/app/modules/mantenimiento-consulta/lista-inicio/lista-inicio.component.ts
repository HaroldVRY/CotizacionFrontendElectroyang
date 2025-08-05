import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';

import { CotizacionService } from '../../../service/cotizacion.service';
import { Cotizacion, PaginatedResponse } from '../../../interface/cotizacion.interface';

@Component({
  selector: 'app-lista-inicio',
  standalone: false,
  templateUrl: './lista-inicio.component.html',
  styleUrl: './lista-inicio.component.css'
})
export class ListaInicioComponent implements OnInit, OnDestroy {
  // Datos y paginación
  cotizaciones: Cotizacion[] = [];
  totalRecords = 0;
  loading = false;
  first = 0;
  rows = 10;

  // Filtros
  filters = {
    estado: '',
    cliente: '',
    fechaInicio: '',
    fechaFin: ''
  };

  // Estados
  estadoOptions = [
    { label: 'Todos', value: '' },
    { label: 'Borrador', value: 'borrador' },
    { label: 'Aprobada', value: 'aprobada' },
    { label: 'Rechazada', value: 'rechazada' }
  ];

  // Columnas de la tabla
  cols = [
    { field: 'numero', header: 'Número', sortable: true },
    { field: 'fecha', header: 'Fecha', sortable: true },
    { field: 'cliente', header: 'Cliente', sortable: true },
    { field: 'estado', header: 'Estado', sortable: true },
    { field: 'precioTotal', header: 'Total', sortable: true },
    { field: 'acciones', header: 'Acciones', sortable: false }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private cotizacionService: CotizacionService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCotizaciones();

    // Suscribirse a errores del servicio
    this.cotizacionService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar cotizaciones con paginación
   */
  loadCotizaciones(event?: any): void {
    this.loading = true;

    let page = 1;
    if (event) {
      page = Math.floor(event.first / event.rows) + 1;
      this.rows = event.rows;
      this.first = event.first;
    }

    const cleanFilters = this.getCleanFilters();

    this.cotizacionService.getCotizaciones(page, this.rows, cleanFilters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: PaginatedResponse<Cotizacion>) => {
          this.cotizaciones = response.data.map(cotizacion => ({
            ...cotizacion,
            precioTotalFormatted: this.cotizacionService.formatearPrecio(cotizacion.precioTotal || 0)
          }));
          this.totalRecords = response.total;
        },
        error: (error) => {
          console.error('Error al cargar cotizaciones:', error);
        }
      });
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    this.first = 0; // Resetear a la primera página
    this.loadCotizaciones();
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.filters = {
      estado: '',
      cliente: '',
      fechaInicio: '',
      fechaFin: ''
    };
    this.applyFilters();
  }

  /**
   * Obtener filtros limpios (sin valores vacíos)
   */
  private getCleanFilters(): any {
    const cleanFilters: any = {};

    Object.keys(this.filters).forEach(key => {
      const value = (this.filters as any)[key];
      if (value && value.trim() !== '') {
        cleanFilters[key] = value;
      }
    });

    return Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined;
  }

  /**
   * Crear nueva cotización
   */
  nuevaCotizacion(): void {
    this.router.navigate(['/creacion-cotizacion/detalle-creacion1']);
  }

  /**
   * Ver detalle de cotización
   */
  verDetalle(cotizacion: Cotizacion): void {
    this.router.navigate(['/creacion-cotizacion/detalle-creacion1'], {
      queryParams: { id: cotizacion.id, modo: 'ver' }
    });
  }

  /**
   * Editar cotización
   */
  editarCotizacion(cotizacion: Cotizacion): void {
    this.router.navigate(['/creacion-cotizacion/detalle-creacion1'], {
      queryParams: { id: cotizacion.id, modo: 'editar' }
    });
  }

  /**
   * Duplicar cotización
   */
  duplicarCotizacion(cotizacion: Cotizacion): void {
    this.router.navigate(['/creacion-cotizacion/detalle-creacion1'], {
      queryParams: { id: cotizacion.id, modo: 'duplicar' }
    });
  }

  /**
   * Eliminar cotización
   */
  eliminarCotizacion(cotizacion: Cotizacion): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la cotización ${cotizacion.numero}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (cotizacion.id) {
          this.cotizacionService.deleteCotizacion(cotizacion.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Cotización eliminada correctamente'
                });
                this.loadCotizaciones();
              },
              error: (error) => {
                console.error('Error al eliminar cotización:', error);
              }
            });
        }
      }
    });
  }

  /**
   * Generar reporte PDF
   */
  generarReporte(cotizacion: Cotizacion): void {
    if (!cotizacion.id) return;

    this.cotizacionService.generarReporte(cotizacion.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `cotizacion-${cotizacion.numero}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Reporte generado correctamente'
          });
        },
        error: (error) => {
          console.error('Error al generar reporte:', error);
        }
      });
  }

  /**
   * Cambiar estado de cotización
   */
  cambiarEstado(cotizacion: Cotizacion, nuevoEstado: 'aprobada' | 'rechazada'): void {
    if (!cotizacion.id) return;

    const mensaje = nuevoEstado === 'aprobada' ? 'aprobar' : 'rechazar';

    this.confirmationService.confirm({
      message: `¿Está seguro de ${mensaje} la cotización ${cotizacion.numero}?`,
      header: 'Confirmar Acción',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.cotizacionService.updateCotizacion(cotizacion.id!, { estado: nuevoEstado })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `Cotización ${nuevoEstado} correctamente`
              });
              this.loadCotizaciones();
            },
            error: (error) => {
              console.error('Error al cambiar estado:', error);
            }
          });
      }
    });
  }

  /**
   * Obtener clase CSS según el estado
   */
  getEstadoSeverity(estado: string): string {
    switch (estado) {
      case 'aprobada': return 'success';
      case 'rechazada': return 'danger';
      case 'borrador': return 'warning';
      default: return 'info';
    }
  }

  /**
   * Obtener etiqueta del estado
   */
  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'borrador': return 'Borrador';
      default: return estado;
    }
  }

  /**
   * Obtener items del menú para una cotización
   */
  getMenuItems(cotizacion: Cotizacion): any[] {
    return [
      {
        label: 'Aprobar',
        icon: 'pi pi-check',
        command: () => this.cambiarEstado(cotizacion, 'aprobada'),
        visible: cotizacion.estado !== 'aprobada'
      },
      {
        label: 'Rechazar',
        icon: 'pi pi-times',
        command: () => this.cambiarEstado(cotizacion, 'rechazada'),
        visible: cotizacion.estado !== 'rechazada'
      },
      { separator: true },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.eliminarCotizacion(cotizacion),
        visible: cotizacion.estado === 'borrador'
      }
    ].filter(item => item.visible !== false);
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE');
  }
}
