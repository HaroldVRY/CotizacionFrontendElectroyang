import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CotizacionService } from '../../../service/cotizacion.service';
import { Cotizacion, PaginatedResponse } from '../../../modules/cotizar/interface/cotizacion.interface';

@Component({
  selector: 'app-mant-cons',
  standalone: false,
  templateUrl: './mant-cons.component.html',
  styleUrl: './mant-cons.component.css'
})
export class MantConsComponent implements OnInit, OnDestroy {
  // Datos y paginación
  cotizaciones: Cotizacion[] = [];
  totalRecords = 0;
  loading = false;
  first = 0;
  rows = 10;

  // Control de filtros
  filtrosVisibles = false;

  // Filtros por columna
  filtroNumero = '';
  filtroFecha: Date | null = null;
  filtroCliente = '';
  filtroReceptor = '';
  filtroEstado = '';

  // Búsqueda global
  filtroGlobal = '';

  // Filtros originales (para compatibilidad con paginación del servidor)
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
    { label: 'Enviada', value: 'enviada' },
    { label: 'Aprobada', value: 'aprobada' },
    { label: 'Rechazada', value: 'rechazada' }
  ];

  // Columnas de la tabla
  columnasDinamicas = [
    { field: 'numero', header: 'Número', sortable: true, filtrable: true, tipo: 'texto' },
    { field: 'fecha', header: 'Fecha', sortable: true, filtrable: true, tipo: 'fecha' },
    { field: 'cliente', header: 'Cliente', sortable: true, filtrable: true, tipo: 'texto' },
    { field: 'receptor', header: 'Receptor', sortable: false, filtrable: true, tipo: 'texto' },
    { field: 'estado', header: 'Estado', sortable: true, filtrable: true, tipo: 'dropdown' },
    { field: 'precioTotal', header: 'Total', sortable: true, filtrable: false, tipo: 'numero' },
    { field: 'acciones', header: 'Acciones', sortable: false, filtrable: false, tipo: 'acciones' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private cotizacionService: CotizacionService,
    private router: Router,
    private route: ActivatedRoute,
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
   * Cargar cotizaciones - ahora carga todas las cotizaciones para filtrado local
   */
  loadCotizaciones(event?: any): void {
    this.loading = true;

    // Para filtrado local, cargamos todas las cotizaciones
    const cleanFilters = this.getCleanFilters();

    this.cotizacionService.getCotizaciones(1, 1000, cleanFilters) // Cargar hasta 1000 registros
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: PaginatedResponse<Cotizacion>) => {
          this.cotizaciones = response.data.map(cotizacion => ({
            ...cotizacion,
            // Asegurarse de que los campos estén formateados
            precioTotalFormatted: cotizacion.precioTotalFormatted ||
              this.cotizacionService.formatearPrecio(cotizacion.totalNumeric || 0),
            cliente: cotizacion.cliente || cotizacion.clienteNombre,
            fechaFormatted: cotizacion.fechaFormatted || this.formatearFecha(cotizacion.fecha)
          }));
          this.totalRecords = this.cotizaciones.length;
        },
        error: (error) => {
          console.error('Error al cargar cotizaciones:', error);
        }
      });
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
    this.router.navigate(['/cotizar/mantenimiento-consulta/creacion']);
  }

  /**
   * Ver detalle de cotización
   */
  verDetalle(cotizacion: Cotizacion): void {
    this.router.navigate(['/cotizar/mantenimiento-consulta/creacion'], {
      queryParams: { id: cotizacion.id, modo: 'ver' }
    });
  }

  /**
   * Editar cotización
   */
  editarCotizacion(cotizacion: Cotizacion): void {
    this.router.navigate(['/cotizar/mantenimiento-consulta/creacion'], {
      queryParams: { id: cotizacion.id, modo: 'editar' }
    });
  }

  /**
   * Duplicar cotización
   */
  duplicarCotizacion(cotizacion: Cotizacion): void {
    this.router.navigate(['/cotizar/mantenimiento-consulta/creacion'], {
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
    if (!cotizacion.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se puede generar el reporte: ID de cotización no válido'
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Generando reporte',
      detail: 'Por favor espere...'
    });

    this.cotizacionService.generarReporte(cotizacion.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          if (blob.size > 0) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cotizacion-${cotizacion.numero}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Reporte generado y descargado correctamente'
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'El archivo PDF está vacío'
            });
          }
        },
        error: (error) => {
          console.error('Error al generar reporte:', error);
          let errorMessage = 'Error desconocido al generar el reporte';
          
          if (error.status === 404) {
            errorMessage = 'El servicio de reportes no está disponible. Contacte al administrador.';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor al generar el reporte';
          } else if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error al generar reporte',
            detail: errorMessage
          });
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
      case 'enviada': return 'info';
      case 'borrador': return 'warning';
      default: return 'secondary';
    }
  }

  /**
   * Obtener etiqueta del estado
   */
  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'enviada': return 'Enviada';
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

  // ===== MÉTODOS DE FILTRADO =====

  /**
   * Manejar eventos de filtrado de la tabla (para compatibilidad)
   */
  onTableFilter(): void {
    // Método requerido por el template para eventos de filtrado
  }

  /**
   * Alternar visibilidad de filtros por columna
   */
  toggleFiltros(): void {
    this.filtrosVisibles = !this.filtrosVisibles;
    if (!this.filtrosVisibles) {
      this.limpiarFiltrosColumna();
    }
  }

  /**
   * Limpiar todos los filtros (búsqueda global y por columna)
   */
  clear(table: any, searchInput: any): void {
    // Limpiar búsqueda global
    this.filtroGlobal = '';
    if (searchInput) {
      searchInput.value = '';
    }

    // Limpiar filtros por columna
    this.limpiarFiltrosColumna();

    // Limpiar tabla usando PrimeNG
    if (table) {
      table.clear();
    }

    // Limpiar filtros originales
    this.clearFilters();
  }

  /**
   * Limpiar filtros por columna
   */
  private limpiarFiltrosColumna(): void {
    this.filtroNumero = '';
    this.filtroFecha = null;
    this.filtroCliente = '';
    this.filtroReceptor = '';
    this.filtroEstado = '';
  }

  /**
   * Limpiar filtros originales (para compatibilidad con servidor)
   */
  private clearFilters(): void {
    this.filters = {
      estado: '',
      cliente: '',
      fechaInicio: '',
      fechaFin: ''
    };
  }

}
