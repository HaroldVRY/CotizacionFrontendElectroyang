import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ClienteService } from '../../../service/cliente.service';
import { RequestHandlerService } from '../../../shared/services/request-handler.service';
import { Cliente } from '../interface/cotizacion.interface';

@Component({
  selector: 'app-clientes',
  standalone: false,
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  loading = false;
  busquedaGlobal = '';
  rows = 10;

  // Control de filtros
  filtrosVisibles = false;

  // Campos para filtros específicos
  filtroNombre = '';
  filtroRuc = '';
  filtroEmail = '';
  filtroContacto = '';
  filtroTelefono = '';
  filtroDireccion = '';

  // Columnas de la tabla
  columnasDinamicas = [
    { field: 'id', header: 'ID', sortable: true, filtrable: false, tipo: 'numero' },
    { field: 'nombre', header: 'Nombre', sortable: true, filtrable: true, tipo: 'texto' },
    { field: 'ruc', header: 'RUC', sortable: true, filtrable: true, tipo: 'texto' },
    { field: 'email', header: 'Email', sortable: true, filtrable: true, tipo: 'texto' },
    { field: 'contacto', header: 'Contacto', sortable: true, filtrable: true, tipo: 'texto' },
    { field: 'telefono', header: 'Teléfono', sortable: false, filtrable: true, tipo: 'texto' },
    { field: 'direccion', header: 'Dirección', sortable: false, filtrable: true, tipo: 'texto' },
    { field: 'created_at', header: 'Fecha Creación', sortable: true, filtrable: false, tipo: 'fecha' },
    { field: 'acciones', header: 'Acciones', sortable: false, filtrable: false, tipo: 'acciones' }
  ];

  // Columnas visibles (sin acciones)
  get columnasDinamicasVisibles() {
    return this.columnasDinamicas.filter(col => col.field !== 'acciones');
  }

  private destroy$ = new Subject<void>();

  constructor(
    private clienteService: ClienteService,
    private requestHandler: RequestHandlerService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarClientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarClientes(): void {
    this.loading = true;

    this.requestHandler.handle(this.clienteService.getClientes())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.clientes = response.data;
            this.clientesFiltrados = [...this.clientes];
            this.requestHandler.showSuccess(`Se cargaron ${this.clientes.length} clientes`);
          }
        },
        error: (error: any) => {
          console.error('Error al cargar clientes:', error);
        }
      });
  }

  onBusquedaGlobal(): void {
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    this.clientesFiltrados = this.clientes.filter(cliente => {
      const busquedaGlobalMatch = this.busquedaGlobal === '' ||
        cliente.nombre.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        cliente.ruc.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        cliente.email.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        cliente.contacto.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        cliente.telefono.toLowerCase().includes(this.busquedaGlobal.toLowerCase()) ||
        cliente.direccion.toLowerCase().includes(this.busquedaGlobal.toLowerCase());

      const filtroNombreMatch = this.filtroNombre === '' ||
        cliente.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const filtroRucMatch = this.filtroRuc === '' ||
        cliente.ruc.toLowerCase().includes(this.filtroRuc.toLowerCase());

      const filtroEmailMatch = this.filtroEmail === '' ||
        cliente.email.toLowerCase().includes(this.filtroEmail.toLowerCase());

      const filtroContactoMatch = this.filtroContacto === '' ||
        cliente.contacto.toLowerCase().includes(this.filtroContacto.toLowerCase());

      const filtroTelefonoMatch = this.filtroTelefono === '' ||
        cliente.telefono.toLowerCase().includes(this.filtroTelefono.toLowerCase());

      const filtroDireccionMatch = this.filtroDireccion === '' ||
        cliente.direccion.toLowerCase().includes(this.filtroDireccion.toLowerCase());

      return busquedaGlobalMatch && filtroNombreMatch && filtroRucMatch &&
        filtroEmailMatch && filtroContactoMatch && filtroTelefonoMatch && filtroDireccionMatch;
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
    this.filtroRuc = '';
    this.filtroEmail = '';
    this.filtroContacto = '';
    this.filtroTelefono = '';
    this.filtroDireccion = '';
  }

  /**
   * Manejar eventos de filtrado de la tabla (para compatibilidad)
   */
  onTableFilter(): void {
    // Método requerido por el template para eventos de filtrado
  }

  /**
   * Crear nuevo cliente
   */
  nuevoCliente(): void {
    this.router.navigate(['/cotizar/clientes', 'nuevo']);
  }

  /**
   * Ver detalle de cliente
   */
  verDetalle(cliente: Cliente): void {
    this.router.navigate(['/cotizar/clientes', cliente.id]);
  }

  limpiarFiltros(): void {
    this.busquedaGlobal = '';
    this.filtroNombre = '';
    this.filtroRuc = '';
    this.filtroEmail = '';
    this.filtroContacto = '';
    this.filtroTelefono = '';
    this.filtroDireccion = '';
    this.clientesFiltrados = [...this.clientes];
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}
