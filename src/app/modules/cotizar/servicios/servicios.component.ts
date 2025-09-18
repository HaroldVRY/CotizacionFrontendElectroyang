import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Servicio } from '../interface/cotizacion.interface';

@Component({
  selector: 'app-servicios',
  standalone: false,
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css',
  providers: [MessageService]
})
export class ServiciosComponent implements OnInit {
  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];
  loading = false;
  busquedaGlobal = '';

  // Campos para filtros específicos
  filtroNombre = '';
  filtroDescripcion = '';
  filtroPrecio = '';
  filtroActivo: boolean | null = null;

  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.loading = true;
    const url = `${this.API_URL}/servicios`;

    this.http.get<{success: boolean, data: Servicio[]}>(url).subscribe({
      next: (response) => {
        if (response.success) {
          this.servicios = response.data;
          this.serviciosFiltrados = [...this.servicios];
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Se cargaron ${this.servicios.length} servicios`
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de servicios'
        });
        this.loading = false;
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

      const filtroActivoMatch = this.filtroActivo === null ||
        servicio.activo === this.filtroActivo;

      return busquedaGlobalMatch && filtroNombreMatch && filtroDescripcionMatch &&
             filtroPrecioMatch && filtroActivoMatch;
    });
  }

  limpiarFiltros(): void {
    this.busquedaGlobal = '';
    this.filtroNombre = '';
    this.filtroDescripcion = '';
    this.filtroPrecio = '';
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
