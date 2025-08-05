export interface ItemCotizacion {
  numeroItem: number;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  total?: number;
  precioUnitarioFormatted?: string;
  totalFormatted?: string;
}

export interface Banco {
  nombre: string;
  cuentaCorriente: string;
  cuentaInterbancaria: string;
}

export interface Cotizacion {
  id?: string;
  numero: string;
  fecha: string;
  cliente: string;
  receptor: string;
  items: ItemCotizacion[];
  observaciones?: string;
  tiempoEntrega: string;
  formaPago: string;
  banco?: Banco;
  estado?: 'borrador' | 'aprobada' | 'rechazada';
  precioTotal?: number;
  precioTotalFormatted?: string;
  precioTotalLetras?: string;
  mostrarDatosBancarios?: boolean;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}

export interface Cliente {
  id?: string;
  nombre: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
}

export interface Servicio {
  id?: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  activo?: boolean;
}

export interface CreateCotizacionRequest {
  cliente: string;
  receptor: string;
  items: ItemCotizacion[];
  observaciones?: string;
  tiempoEntrega: string;
  formaPago: string;
  banco?: Banco;
  mostrarDatosBancarios?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
