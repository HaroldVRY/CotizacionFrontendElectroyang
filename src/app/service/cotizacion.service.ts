import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Cotizacion,
  ItemCotizacion,
  CreateCotizacionRequest,
  ApiResponse,
  PaginatedResponse,
  Cliente,
  Servicio
} from '../interface/cotizacion.interface';@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';

  // Estado para manejar loading y errores
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== COTIZACIONES =====

  /**
   * Obtener todas las cotizaciones con paginación
   */
  getCotizaciones(page: number = 1, limit: number = 10, filters?: any): Observable<PaginatedResponse<Cotizacion>> {
    this.setLoading(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.estado) params = params.set('estado', filters.estado);
      if (filters.cliente) params = params.set('cliente', filters.cliente);
      if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
    }

    return this.http.get<any>(`${this.API_URL}/cotizaciones`, { params })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();

          // Procesar datos para compatibilidad con la vista
          const cotizacionesProcesadas = response.data?.map((cotizacion: any) => this.procesarCotizacionParaLista(cotizacion)) || [];

          // Si no viene con estructura de paginación, crear una
          if (response.data && Array.isArray(response.data)) {
            return {
              data: cotizacionesProcesadas,
              total: cotizacionesProcesadas.length,
              page: page,
              limit: limit,
              totalPages: Math.ceil(cotizacionesProcesadas.length / limit)
            };
          }

          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar las cotizaciones');
          throw error;
        })
      );
  }

  /**
   * Obtener una cotización por ID
   */
  getCotizacionById(id: string | number): Observable<ApiResponse<Cotizacion>> {
    this.setLoading(true);

    return this.http.get<any>(`${this.API_URL}/cotizaciones/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();

          if (response.success && response.data) {
            // Procesar los datos para que sean compatibles con el componente
            const cotizacionProcesada = this.procesarCotizacionDetalle(response.data);
            return {
              success: true,
              data: cotizacionProcesada
            };
          }

          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar la cotización');
          throw error;
        })
      );
  }  /**
   * Crear nueva cotización
   */
  createCotizacion(cotizacion: CreateCotizacionRequest): Observable<ApiResponse<Cotizacion>> {
    this.setLoading(true);

    return this.http.post<ApiResponse<Cotizacion>>(`${this.API_URL}/cotizaciones`, cotizacion)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al crear la cotización');
          throw error;
        })
      );
  }

  /**
   * Actualizar cotización
   */
  updateCotizacion(id: string | number, cotizacion: Partial<Cotizacion>): Observable<ApiResponse<Cotizacion>> {
    this.setLoading(true);

    return this.http.put<ApiResponse<Cotizacion>>(`${this.API_URL}/cotizaciones/${id}`, cotizacion)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al actualizar la cotización');
          throw error;
        })
      );
  }

  /**
   * Eliminar cotización
   */
  deleteCotizacion(id: string | number): Observable<ApiResponse<void>> {
    this.setLoading(true);

    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/cotizaciones/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al eliminar la cotización');
          throw error;
        })
      );
  }  // ===== CLIENTES =====

  /**
   * Obtener todos los clientes
   */
  getClientes(): Observable<ApiResponse<Cliente[]>> {
    return this.http.get<ApiResponse<Cliente[]>>(`${this.API_URL}/clientes`)
      .pipe(
        catchError(error => {
          this.setError('Error al cargar los clientes');
          throw error;
        })
      );
  }

  // ===== SERVICIOS =====

  /**
   * Obtener todos los servicios
   */
  getServicios(): Observable<ApiResponse<Servicio[]>> {
    return this.http.get<ApiResponse<Servicio[]>>(`${this.API_URL}/servicios`)
      .pipe(
        catchError(error => {
          this.setError('Error al cargar los servicios');
          throw error;
        })
      );
  }

  // ===== REPORTES =====

  /**
   * Generar reporte PDF
   */
  generarReporte(id: string | number): Observable<Blob> {
    this.setLoading(true);

    return this.http.get(`${this.API_URL}/generar-reporte/${id}`, { responseType: 'blob' })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al generar el reporte');
          throw error;
        })
      );
  }  // ===== UTILIDADES =====

  /**
   * Procesar cotización para vista de lista
   */
  private procesarCotizacionParaLista(cotizacion: any): Cotizacion {
    return {
      ...cotizacion,
      // Mapear campos para compatibilidad
      cliente: cotizacion.clientenombre || cotizacion.clienteNombre,
      precioTotal: this.convertirANumero(cotizacion.total),
      precioTotalFormatted: this.formatearPrecio(this.convertirANumero(cotizacion.total)),
      fechaFormatted: this.formatearFecha(cotizacion.fecha),
      // Mantener campos originales
      totalNumeric: this.convertirANumero(cotizacion.total),
      subtotalNumeric: this.convertirANumero(cotizacion.subtotal),
      igvNumeric: this.convertirANumero(cotizacion.igv)
    };
  }

  /**
   * Procesar cotización detalle para formulario
   */
  private procesarCotizacionDetalle(cotizacion: any): Cotizacion {
    // Simular datos bancarios por defecto
    const datosBancarios = {
      nombre: 'Banco de Crédito del Perú',
      cuentaCorriente: '000-123456789',
      cuentaInterbancaria: '018-000-123456789-01'
    };

    const cotizacionProcesada: Cotizacion = {
      ...cotizacion,
      // Mapear campos para compatibilidad con el formulario
      cliente: cotizacion.clienteNombre,
      items: cotizacion.detalles?.map((detalle: any) => this.procesarItemDetalle(detalle)) || [],
      precioTotal: this.convertirANumero(cotizacion.total),
      precioTotalFormatted: this.formatearPrecio(this.convertirANumero(cotizacion.total)),
      fechaFormatted: this.formatearFecha(cotizacion.fecha),
      // Mantener campos originales
      totalNumeric: this.convertirANumero(cotizacion.total),
      subtotalNumeric: this.convertirANumero(cotizacion.subtotal),
      igvNumeric: this.convertirANumero(cotizacion.igv),
      // Simular datos bancarios
      banco: datosBancarios,
      // Mantener valores originales de la base de datos
      tiempoEntrega: cotizacion.tiempoEntrega,
      formaPago: cotizacion.formaPago
    };

    return cotizacionProcesada;
  }

  /**
   * Procesar item de detalle
   */
  private procesarItemDetalle(detalle: any): ItemCotizacion {
    return {
      ...detalle,
      // Convertir a números para el formulario
      cantidadNumeric: this.convertirANumero(detalle.cantidad),
      precioUnitarioNumeric: this.convertirANumero(detalle.precioUnitario),
      totalNumeric: this.convertirANumero(detalle.total),
      // Formatear para vista
      precioUnitarioFormatted: this.formatearPrecio(this.convertirANumero(detalle.precioUnitario)),
      totalFormatted: this.formatearPrecio(this.convertirANumero(detalle.total))
    };
  }

  /**
   * Convertir string a número
   */
  private convertirANumero(valor: string | number): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const numero = parseFloat(valor);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  /**
   * Formatear fecha
   */
  private formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE');
  }

  /**
   * Calcular total de item
   */
  calcularTotalItem(cantidad: number, precioUnitario: number): number {
    return cantidad * precioUnitario;
  }  /**
   * Calcular total de cotización
   */
  calcularTotalCotizacion(items: any[]): number {
    return items.reduce((total, item) => {
      return total + this.calcularTotalItem(item.cantidad, item.precioUnitario);
    }, 0);
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(precio);
  }

  /**
   * Generar número de cotización automático
   */
  generarNumeroCotizacion(): string {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `COT-${year}${month}-${timestamp}`;
  }

  // ===== GESTIÓN DE ESTADO =====

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  // Método público para limpiar errores
  clearErrors(): void {
    this.clearError();
  }
}
