export interface ItemCotizacion {
  id?: number;
  cotizacionId?: number;
  servicioId?: number;
  numeroItem: number;
  cantidad: string | number;
  descripcion: string;
  precioUnitario: string | number;
  total: string | number;
  createdAt?: string;
  updatedAt?: string;
  servicioNombre?: string;
  // Campos calculados para la vista
  cantidadNumeric?: number;
  precioUnitarioNumeric?: number;
  totalNumeric?: number;
  precioUnitarioFormatted?: string;
  totalFormatted?: string;
}

export interface Banco {
  nombre: string;
  cuentaCorriente: string;
  cuentaInterbancaria: string;
}

export interface Cotizacion {
  id?: number;
  numero: string;
  fecha: string;
  clienteId?: number;
  usuarioId?: number;
  receptor: string;
  observaciones?: string;
  tiempoEntrega: string;
  formaPago: string;
  estado?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  subtotal: string | number;
  igv: string | number;
  total: string | number;
  createdAt?: string;
  updatedAt?: string;
  clienteNombre?: string;
  usuarioNombre?: string;
  detalles?: ItemCotizacion[];
  banco?: Banco;
  // Campos calculados para la vista
  subtotalNumeric?: number;
  igvNumeric?: number;
  totalNumeric?: number;
  precioTotalFormatted?: string;
  fechaFormatted?: string;
  // Para compatibilidad con la vista anterior
  cliente?: string;
  items?: ItemCotizacion[];
  precioTotal?: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto: string;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  unidad: string;
  activo: boolean;
}

export interface CreateCotizacionRequest {
  clienteId: number;
  receptor: string;
  observaciones?: string;
  tiempoEntrega: string;
  formaPago: string;
  detalles: DetalleItem[];
}

export interface DetalleItem {
  servicioId?: number | null;
  numeroItem: number;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
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

// Interfaces para Usuario
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vendedor' | 'gerente';
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
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

// Tipos de errores de validación
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: ValidationError[];
  statusCode?: number;
}
