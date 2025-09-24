import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Cliente, ApiResponse, PaginatedResponse } from '../modules/cotizar/interface/cotizacion.interface';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';

  // Estado para manejar loading y errores
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== CLIENTES =====

  /**
   * Obtener todos los clientes con paginación opcional
   */
  getClientes(page?: number, limit?: number, filters?: any): Observable<ApiResponse<Cliente[]> | PaginatedResponse<Cliente>> {
    this.setLoading(true);

    let params = new HttpParams();

    if (page !== undefined && limit !== undefined) {
      params = params.set('page', page.toString()).set('limit', limit.toString());
    }

    if (filters) {
      if (filters.nombre) params = params.set('nombre', filters.nombre);
      if (filters.ruc) params = params.set('ruc', filters.ruc);
      if (filters.email) params = params.set('email', filters.email);
      if (filters.activo !== undefined) params = params.set('activo', filters.activo.toString());
    }

    return this.http.get<ApiResponse<Cliente[]>>(`${this.API_URL}/clientes`, { params })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar los clientes');
          throw error;
        })
      );
  }

  /**
   * Obtener un cliente por ID
   */
  getClienteById(id: string | number): Observable<ApiResponse<Cliente>> {
    this.setLoading(true);

    return this.http.get<ApiResponse<Cliente>>(`${this.API_URL}/clientes/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar el cliente');
          throw error;
        })
      );
  }

  /**
   * Crear nuevo cliente
   */
  createCliente(cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
    this.setLoading(true);

    return this.http.post<ApiResponse<Cliente>>(`${this.API_URL}/clientes`, cliente)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al crear el cliente');
          throw error;
        })
      );
  }

  /**
   * Actualizar cliente
   */
  updateCliente(id: string | number, cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
    this.setLoading(true);

    return this.http.put<ApiResponse<Cliente>>(`${this.API_URL}/clientes/${id}`, cliente)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al actualizar el cliente');
          throw error;
        })
      );
  }

  /**
   * Eliminar cliente
   */
  deleteCliente(id: string | number): Observable<ApiResponse<void>> {
    this.setLoading(true);

    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/clientes/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al eliminar el cliente');
          throw error;
        })
      );
  }

  /**
   * Buscar clientes por término
   */
  buscarClientes(termino: string): Observable<ApiResponse<Cliente[]>> {
    return this.http.get<ApiResponse<Cliente[]>>(`${this.API_URL}/clientes/search?term=${encodeURIComponent(termino)}`)
      .pipe(
        catchError(error => {
          this.setError('Error al buscar clientes');
          throw error;
        })
      );
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
