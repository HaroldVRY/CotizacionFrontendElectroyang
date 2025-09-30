import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ServicioService } from '../../../service/servicio.service';
import { RequestHandlerService } from '../../../shared/services/request-handler.service';
import { Servicio } from '../interface/cotizacion.interface';

@Component({
  selector: 'app-servicios',
  standalone: false,
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css',
  providers: [MessageService]
})
export class ServiciosComponent implements OnInit, OnDestroy {
  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];
  loading = false;
  busquedaGlobal = '';
  rows = 10;

  // Control de filtros
  filtrosVisibles = false;

  // Campos para filtros específicos
  filtroNombre = '';
  filtroDescripcion = '';
  filtroPrecio = '';
  filtroUnidad = '';
  filtroActivo: boolean | null = null;

  // Opciones para el dropdown de estado
  estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  // Columnas de la tabla
  columnasDinamicas = [
    { field: 'id', header: 'ID', sortable: true, filtrable: false, tipo: 'numero', ancho: '80px' },
    { field: 'nombre', header: 'Nombre', sortable: true, filtrable: true, tipo: 'texto', ancho: '200px' },
    { field: 'descripcion', header: 'Descripción', sortable: false, filtrable: true, tipo: 'texto', ancho: '300px' },
    { field: 'precio', header: 'Precio', sortable: true, filtrable: true, tipo: 'texto', ancho: '120px' },
    { field: 'unidad', header: 'Unidad', sortable: true, filtrable: true, tipo: 'texto', ancho: '100px' },
    { field: 'activo', header: 'Estado', sortable: true, filtrable: true, tipo: 'dropdown', ancho: '100px' },
    { field: 'acciones', header: 'Acciones', sortable: false, filtrable: false, tipo: 'acciones', ancho: '120px' }
  ];

  // Columnas visibles (sin acciones)
  get columnasDinamicasVisibles() {
    return this.columnasDinamicas.filter(col => col.field !== 'acciones');
  }

  private destroy$ = new Subject<void>();

  constructor(
    private servicioService: ServicioService,
    private requestHandler: RequestHandlerService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarServicios(): void {
    this.loading = true;

    this.requestHandler.handle(this.servicioService.getServicios())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.servicios = response.data;
            this.serviciosFiltrados = [...this.servicios];
            this.requestHandler.showSuccess(`Se cargaron ${this.servicios.length} servicios`);
          }
        },
        error: (error: any) => {
          console.error('Error al cargar servicios:', error);
        }
      });
  }

  onBusquedaGlobal(): void {
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    this.serviciosFiltrados = this.servicios.filter(servicio => {
      const busquedaGlobalMatch = this.busquedaGlobal === '' ||
        servicio.nombre.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        servicio.precio.toString().includes(this.busquedaGlobal.toLowerCase()) ||
        servicio.unidad.toLowerCase().includes(this.busquedaGlobal.toLowerCase());

      const filtroNombreMatch = this.filtroNombre === '' ||
        servicio.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const filtroDescripcionMatch = this.filtroDescripcion === '' ||
        servicio.descripcion.toLowerCase().includes(this.filtroDescripcion.toLowerCase());

      const filtroPrecioMatch = this.filtroPrecio === '' ||
        servicio.precio.toString().includes(this.filtroPrecio);

      const filtroUnidadMatch = this.filtroUnidad === '' ||
        servicio.unidad.toLowerCase().includes(this.filtroUnidad.toLowerCase());

      const filtroActivoMatch = this.filtroActivo === null ||
        servicio.activo === this.filtroActivo;

      return busquedaGlobalMatch && filtroNombreMatch && filtroDescripcionMatch &&
             filtroPrecioMatch && filtroUnidadMatch && filtroActivoMatch;
    });
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
    this.busquedaGlobal = '';
    if (searchInput) {
      searchInput.value = '';
    }

    // Limpiar filtros por columna
    this.limpiarFiltrosColumna();

    // Limpiar tabla usando PrimeNG
    if (table) {
      table.clear();
    }

    // Aplicar filtros limpios
    this.aplicarFiltrosLocales();
  }

  /**
   * Limpiar filtros por columna
   */
  private limpiarFiltrosColumna(): void {
    this.filtroNombre = '';
    this.filtroDescripcion = '';
    this.filtroPrecio = '';
    this.filtroUnidad = '';
    this.filtroActivo = null;
  }

  /**
   * Manejar eventos de filtrado de la tabla (para compatibilidad)
   */
  onTableFilter(event?: any): void {
    // Método requerido por el template para eventos de filtrado
    if (event && event.target) {
      this.busquedaGlobal = event.target.value;
      this.aplicarFiltrosLocales();
    }
  }

  /**
   * Obtener campos para filtro global
   */
  getGlobalFilterFields(): string[] {
    return this.columnasDinamicas
      .filter(col => col.filtrable)
      .map(col => col.field);
  }

  /**
   * Aplicar filtros (alias para compatibilidad con template)
   */
  aplicarFiltros(): void {
    this.aplicarFiltrosLocales();
  }

  /**
   * Editar servicio
   */
  editarServicio(servicio: Servicio): void {
    // TODO: Implementar navegación a formulario de edición
    this.messageService.add({
      severity: 'info',
      summary: 'Función pendiente',
      detail: `Editar servicio: ${servicio.nombre}`
    });
  }

  /**
   * Eliminar servicio
   */
  eliminarServicio(servicio: Servicio): void {
    // TODO: Implementar confirmación y eliminación
    this.messageService.add({
      severity: 'warn',
      summary: 'Función pendiente',
      detail: `Eliminar servicio: ${servicio.nombre}`
    });
  }

  /**
   * Crear nuevo servicio
   */
  nuevoServicio(): void {
    this.router.navigate(['/cotizar/servicios', 'nuevo']);
  }

  /**
   * Ver detalle de servicio
   */
  verDetalle(servicio: Servicio): void {
    this.router.navigate(['/cotizar/servicios', servicio.id]);
  }

  limpiarFiltros(): void {
    this.busquedaGlobal = '';
    this.filtroNombre = '';
    this.filtroDescripcion = '';
    this.filtroPrecio = '';
    this.filtroUnidad = '';
    this.filtroActivo = null;
    this.serviciosFiltrados = [...this.servicios];
  }

  formatearPrecio(precio: string): string {
    return `S/ ${parseFloat(precio).toFixed(2)}`;
  }

  getEstadoTexto(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  getEstadoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }
}
