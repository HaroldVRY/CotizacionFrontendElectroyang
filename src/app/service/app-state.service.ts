import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cliente, Servicio, Cotizacion } from '../modules/cotizar/interface/cotizacion.interface';

interface AppState {
  // Cache de datos frecuentemente usados
  clientes: Cliente[];
  servicios: Servicio[];
  cotizacionesRecientes: Cotizacion[];

  // Estados globales de loading
  loadingClientes: boolean;
  loadingServicios: boolean;
  loadingCotizaciones: boolean;

  // Datos del usuario actual
  currentUser: any;
  isAuthenticated: boolean;

  // Configuración de la app
  configuracion: {
    igvRate: number;
    moneda: string;
    formatoFecha: string;
  };
}

const initialState: AppState = {
  clientes: [],
  servicios: [],
  cotizacionesRecientes: [],
  loadingClientes: false,
  loadingServicios: false,
  loadingCotizaciones: false,
  currentUser: null,
  isAuthenticated: false,
  configuracion: {
    igvRate: 0.18,
    moneda: 'PEN',
    formatoFecha: 'dd/MM/yyyy'
  }
};

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private state$ = new BehaviorSubject<AppState>(initialState);

  constructor() {}

  // ===== GETTERS =====

  getState(): Observable<AppState> {
    return this.state$.asObservable();
  }

  getCurrentState(): AppState {
    return this.state$.value;
  }

  // ===== CLIENTES =====

  getClientes(): Observable<Cliente[]> {
    return new Observable(observer => {
      this.state$.subscribe(state => observer.next(state.clientes));
    });
  }

  setClientes(clientes: Cliente[]): void {
    this.updateState({ clientes });
  }

  addCliente(cliente: Cliente): void {
    const clientes = [...this.getCurrentState().clientes, cliente];
    this.setClientes(clientes);
  }

  updateCliente(cliente: Cliente): void {
    const clientes = this.getCurrentState().clientes.map(c =>
      c.id === cliente.id ? cliente : c
    );
    this.setClientes(clientes);
  }

  removeCliente(clienteId: number): void {
    const clientes = this.getCurrentState().clientes.filter(c => c.id !== clienteId);
    this.setClientes(clientes);
  }

  setLoadingClientes(loading: boolean): void {
    this.updateState({ loadingClientes: loading });
  }

  // ===== SERVICIOS =====

  getServicios(): Observable<Servicio[]> {
    return new Observable(observer => {
      this.state$.subscribe(state => observer.next(state.servicios));
    });
  }

  setServicios(servicios: Servicio[]): void {
    this.updateState({ servicios });
  }

  addServicio(servicio: Servicio): void {
    const servicios = [...this.getCurrentState().servicios, servicio];
    this.setServicios(servicios);
  }

  updateServicio(servicio: Servicio): void {
    const servicios = this.getCurrentState().servicios.map(s =>
      s.id === servicio.id ? servicio : s
    );
    this.setServicios(servicios);
  }

  removeServicio(servicioId: number): void {
    const servicios = this.getCurrentState().servicios.filter(s => s.id !== servicioId);
    this.setServicios(servicios);
  }

  setLoadingServicios(loading: boolean): void {
    this.updateState({ loadingServicios: loading });
  }

  // ===== COTIZACIONES =====

  getCotizacionesRecientes(): Observable<Cotizacion[]> {
    return new Observable(observer => {
      this.state$.subscribe(state => observer.next(state.cotizacionesRecientes));
    });
  }

  setCotizacionesRecientes(cotizaciones: Cotizacion[]): void {
    this.updateState({ cotizacionesRecientes: cotizaciones });
  }

  addCotizacionReciente(cotizacion: Cotizacion): void {
    const cotizacionesRecientes = [cotizacion, ...this.getCurrentState().cotizacionesRecientes]
      .slice(0, 10); // Mantener solo las 10 más recientes
    this.setCotizacionesRecientes(cotizacionesRecientes);
  }

  setLoadingCotizaciones(loading: boolean): void {
    this.updateState({ loadingCotizaciones: loading });
  }

  // ===== USUARIO =====

  setCurrentUser(user: any): void {
    this.updateState({
      currentUser: user,
      isAuthenticated: !!user
    });
  }

  clearCurrentUser(): void {
    this.updateState({
      currentUser: null,
      isAuthenticated: false
    });
  }

  // ===== CONFIGURACIÓN =====

  updateConfiguracion(config: Partial<AppState['configuracion']>): void {
    const configuracion = {
      ...this.getCurrentState().configuracion,
      ...config
    };
    this.updateState({ configuracion });
  }

  // ===== UTILIDADES =====

  private updateState(partial: Partial<AppState>): void {
    const currentState = this.getCurrentState();
    const newState = { ...currentState, ...partial };
    this.state$.next(newState);
  }

  // Resetear estado (útil para logout)
  resetState(): void {
    this.state$.next(initialState);
  }

  // Métodos de utilidad para cache
  isClientesLoaded(): boolean {
    return this.getCurrentState().clientes.length > 0;
  }

  isServiciosLoaded(): boolean {
    return this.getCurrentState().servicios.length > 0;
  }

  // Búsquedas rápidas en cache
  findClienteById(id: number): Cliente | undefined {
    return this.getCurrentState().clientes.find(c => c.id === id);
  }

  findServicioById(id: number): Servicio | undefined {
    return this.getCurrentState().servicios.find(s => s.id === id);
  }

  searchClientes(query: string): Cliente[] {
    const clientes = this.getCurrentState().clientes;
    const queryLower = query.toLowerCase();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(queryLower) ||
      c.ruc.includes(query) ||
      c.email.toLowerCase().includes(queryLower)
    );
  }

  searchServicios(query: string): Servicio[] {
    const servicios = this.getCurrentState().servicios;
    const queryLower = query.toLowerCase();
    return servicios.filter(s =>
      s.nombre.toLowerCase().includes(queryLower) ||
      s.descripcion.toLowerCase().includes(queryLower)
    );
  }
}
