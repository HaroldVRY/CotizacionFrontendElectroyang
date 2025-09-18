import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Cliente } from '../interface/cotizacion.interface';

@Component({
  selector: 'app-clientes',
  standalone: false,
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  loading = false;
  busquedaGlobal = '';

  // Campos para filtros específicos
  filtroNombre = '';
  filtroRuc = '';
  filtroEmail = '';
  filtroContacto = '';

  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading = true;
    const url = `${this.API_URL}/clientes`;

    this.http.get<{ success: boolean, data: Cliente[] }>(url).subscribe({
      next: (response) => {
        if (response.success) {
          this.clientes = response.data;
          this.clientesFiltrados = [...this.clientes];
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Se cargaron ${this.clientes.length} clientes`
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de clientes'
        });
        this.loading = false;
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
        cliente.direccion.toLowerCase().includes(this.busquedaGlobal.toLowerCase());

      const filtroNombreMatch = this.filtroNombre === '' ||
        cliente.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const filtroRucMatch = this.filtroRuc === '' ||
        cliente.ruc.toLowerCase().includes(this.filtroRuc.toLowerCase());

      const filtroEmailMatch = this.filtroEmail === '' ||
        cliente.email.toLowerCase().includes(this.filtroEmail.toLowerCase());

      const filtroContactoMatch = this.filtroContacto === '' ||
        cliente.contacto.toLowerCase().includes(this.filtroContacto.toLowerCase());

      return busquedaGlobalMatch && filtroNombreMatch && filtroRucMatch &&
        filtroEmailMatch && filtroContactoMatch;
    });
  }

  limpiarFiltros(): void {
    this.busquedaGlobal = '';
    this.filtroNombre = '';
    this.filtroRuc = '';
    this.filtroEmail = '';
    this.filtroContacto = '';
    this.clientesFiltrados = [...this.clientes];
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}
