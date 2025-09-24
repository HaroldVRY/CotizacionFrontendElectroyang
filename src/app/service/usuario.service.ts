import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces para Usuario (agregar al archivo de interfaces)
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vendedor' | 'gerente';
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    usuario: Usuario;
    token: string;
    expiresIn: number;
  };
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';

  // Estado para manejar loading y errores
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);

  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay una sesión guardada al inicializar el servicio
    this.checkStoredSession();
  }

  // ===== AUTENTICACIÓN =====

  /**
   * Iniciar sesión
   */
  login(email: string, password: string): Observable<AuthResponse> {
    this.setLoading(true);

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();

          if (response.success && response.data) {
            // Guardar token y usuario en localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentUser', JSON.stringify(response.data.usuario));
            this.currentUserSubject.next(response.data.usuario);
          }

          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al iniciar sesión');
          throw error;
        })
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout`, {})
      .pipe(
        map(() => {
          this.clearSession();
          return { success: true };
        }),
        catchError(() => {
          // Incluso si falla la llamada al servidor, limpiar la sesión local
          this.clearSession();
          return of({ success: true });
        })
      );
  }

  /**
   * Renovar token
   */
  refreshToken(): Observable<AuthResponse> {
    const token = localStorage.getItem('token');

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { token })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentUser', JSON.stringify(response.data.usuario));
            this.currentUserSubject.next(response.data.usuario);
          }
          return response;
        }),
        catchError(error => {
          this.clearSession();
          throw error;
        })
      );
  }

  // ===== GESTIÓN DE USUARIOS =====

  /**
   * Obtener todos los usuarios
   */
  getUsuarios(page?: number, limit?: number, filters?: any): Observable<ApiResponse<Usuario[]>> {
    this.setLoading(true);

    let params = new HttpParams();

    if (page !== undefined && limit !== undefined) {
      params = params.set('page', page.toString()).set('limit', limit.toString());
    }

    if (filters) {
      if (filters.nombre) params = params.set('nombre', filters.nombre);
      if (filters.email) params = params.set('email', filters.email);
      if (filters.rol) params = params.set('rol', filters.rol);
      if (filters.activo !== undefined) params = params.set('activo', filters.activo.toString());
    }

    return this.http.get<ApiResponse<Usuario[]>>(`${this.API_URL}/usuarios`, { params })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar los usuarios');
          throw error;
        })
      );
  }

  /**
   * Obtener un usuario por ID
   */
  getUsuarioById(id: string | number): Observable<ApiResponse<Usuario>> {
    this.setLoading(true);

    return this.http.get<ApiResponse<Usuario>>(`${this.API_URL}/usuarios/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cargar el usuario');
          throw error;
        })
      );
  }

  /**
   * Crear nuevo usuario
   */
  createUsuario(usuario: Partial<Usuario> & { password: string }): Observable<ApiResponse<Usuario>> {
    this.setLoading(true);

    return this.http.post<ApiResponse<Usuario>>(`${this.API_URL}/usuarios`, usuario)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al crear el usuario');
          throw error;
        })
      );
  }

  /**
   * Actualizar usuario
   */
  updateUsuario(id: string | number, usuario: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    this.setLoading(true);

    return this.http.put<ApiResponse<Usuario>>(`${this.API_URL}/usuarios/${id}`, usuario)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al actualizar el usuario');
          throw error;
        })
      );
  }

  /**
   * Eliminar usuario
   */
  deleteUsuario(id: string | number): Observable<ApiResponse<void>> {
    this.setLoading(true);

    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/usuarios/${id}`)
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al eliminar el usuario');
          throw error;
        })
      );
  }

  /**
   * Cambiar contraseña
   */
  cambiarPassword(currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    this.setLoading(true);

    return this.http.put<ApiResponse<void>>(`${this.API_URL}/usuarios/change-password`, {
      currentPassword,
      newPassword
    })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al cambiar la contraseña');
          throw error;
        })
      );
  }

  // ===== UTILIDADES DE SESIÓN =====

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    return !!(token && user);
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Verificar permisos del usuario
   */
  hasRole(rol: string | string[]): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    if (typeof rol === 'string') {
      return currentUser.rol === rol;
    }

    return rol.includes(currentUser.rol);
  }

  /**
   * Verificar si es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // ===== MÉTODOS PRIVADOS =====

  private checkStoredSession(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearSession();
      }
    }
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
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
