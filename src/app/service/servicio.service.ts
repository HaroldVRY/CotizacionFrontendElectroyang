import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Servicio, ApiResponse, PaginatedResponse } from '../modules/cotizar/interface/cotizacion.interface';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';

  // Estado para manejar loading y errores
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== SERVICIOS =====

  /**
   * Obtener todos los servicios con paginación opcional
   */
  getServicios(page?: number, limit?: number, filters?: any): Observable<ApiResponse<Servicio[]> | PaginatedResponse<Servicio>> {
    this.setLoading(true);

    let params = new HttpParams();

    if (page !== undefined && limit !== undefined) {
      params = params.set('page', page.toString()).set('limit', limit.toString());
    }

    if (filters) {
      if (filters.nombre) params = params.set('nombre', filters.nombre);
      if (filters.descripcion) params = params.set('descripcion', filters.descripcion);
      if (filters.activo !== undefined) params = params.set('activo', filters.activo.toString());
      if (filters.precioMin) params = params.set('precioMin', filters.precioMin.toString());
      if (filters.precioMax) params = params.set('precioMax', filters.precioMax.toString());
    }

    return this.http.get<ApiResponse<Servicio[]>>(`${this.API_URL}/servicios`, { params })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar los servicios');
          throw error;
        })
      );
  }

  /**
   * Obtener un servicio por ID
   */
  getServicioById(id: string | number): Observable<ApiResponse<Servicio>> {
    this.setLoading(true);

    return this.http.get<ApiResponse<Servicio>>(`${this.API_URL}/servicios/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar el servicio');
          throw error;
        })
      );
  }

  /**
   * Crear nuevo servicio
   */
  createServicio(servicio: Partial<Servicio>): Observable<ApiResponse<Servicio>> {
    this.setLoading(true);

    return this.http.post<ApiResponse<Servicio>>(`${this.API_URL}/servicios`, servicio)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al crear el servicio');
          throw error;
        })
      );
  }

  /**
   * Actualizar servicio
   */
  updateServicio(id: string | number, servicio: Partial<Servicio>): Observable<ApiResponse<Servicio>> {
    this.setLoading(true);

    return this.http.put<ApiResponse<Servicio>>(`${this.API_URL}/servicios/${id}`, servicio)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al actualizar el servicio');
          throw error;
        })
      );
  }

  /**
   * Eliminar servicio
   */
  deleteServicio(id: string | number): Observable<ApiResponse<void>> {
    this.setLoading(true);

    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/servicios/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al eliminar el servicio');
          throw error;
        })
      );
  }

  /**
   * Buscar servicios por término
   */
  buscarServicios(termino: string): Observable<ApiResponse<Servicio[]>> {
    return this.http.get<ApiResponse<Servicio[]>>(`${this.API_URL}/servicios/search?term=${encodeURIComponent(termino)}`)
      .pipe(
        catchError(error => {
          this.setError('Error al buscar servicios');
          throw error;
        })
      );
  }

  /**
   * Buscar servicios por descripción (búsqueda avanzada)
   */
  buscarServiciosPorDescripcion(descripcion: string): Observable<ApiResponse<Servicio[]>> {
    return this.http.get<ApiResponse<Servicio[]>>(`${this.API_URL}/servicios/search/advanced?descripcion=${encodeURIComponent(descripcion)}`)
      .pipe(
        catchError(error => {
          this.setError('Error al buscar servicios por descripción');
          throw error;
        })
      );
  }

  /**
   * Obtener servicios activos (para cotizaciones)
   */
  getServiciosActivos(): Observable<ApiResponse<Servicio[]>> {
    return this.http.get<ApiResponse<Servicio[]>>(`${this.API_URL}/servicios?activo=true`)
      .pipe(
        catchError(error => {
          this.setError('Error al cargar los servicios activos');
          throw error;
        })
      );
  }

  // ===== UTILIDADES =====

  /**
   * Formatear precio
   */
  formatearPrecio(precio: string | number): string {
    const precioNumero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(precioNumero);
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
