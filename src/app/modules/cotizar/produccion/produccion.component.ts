import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Interface para Maquinaria en Producción
 */
interface Maquinaria {
  id: string;
  nombre: string;
  tipo: string;
  estado: 'operativa' | 'mantenimiento' | 'detenida' | 'en-pausa';
  operario: string;
  ordenCotizacion: string;
  numeroOrden: string;
  cliente: string;
  progreso: number;
  tiempoInicio: Date;
  tiempoEstimadoFin: Date;
  tiempoTranscurrido: string;
  tiempoRestante: string;
  icono: string;
  productoActual: string;
  unidadesProducidas: number;
  unidadesTotales: number;
}

@Component({
  selector: 'app-produccion',
  standalone: false,
  templateUrl: './produccion.component.html',
  styleUrl: './produccion.component.css'
})
export class ProduccionComponent implements OnInit {

  maquinarias: Maquinaria[] = [];
  loading = false;

  // Filtros
  filtroEstado: string = 'todas';
  filtroBusqueda: string = '';

  estadoOptions = [
    { label: 'Todas', value: 'todas' },
    { label: 'Operativas', value: 'operativa' },
    { label: 'En Mantenimiento', value: 'mantenimiento' },
    { label: 'Detenidas', value: 'detenida' },
    { label: 'En Pausa', value: 'en-pausa' }
  ];

  // Vista
  vistaActual: 'grid' | 'lista' = 'grid';

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.cargarDatosSimulados();

    // Actualizar tiempos cada minuto
    setInterval(() => {
      this.actualizarTiempos();
    }, 60000);
  }

  /**
   * Cargar datos simulados de maquinarias
   */
  cargarDatosSimulados(): void {
    this.loading = true;

    // Simular delay de carga
    setTimeout(() => {
      this.maquinarias = [
        {
          id: 'MAQ-001',
          nombre: 'Torno CNC-1',
          tipo: 'Torno CNC',
          estado: 'operativa',
          operario: 'Juan Pérez',
          ordenCotizacion: 'COT-2025-001',
          numeroOrden: 'ORD-001',
          cliente: 'Empresa Industrial SAC',
          progreso: 75,
          tiempoInicio: new Date(2025, 11, 5, 8, 0),
          tiempoEstimadoFin: new Date(2025, 11, 5, 16, 0),
          tiempoTranscurrido: '6h 30m',
          tiempoRestante: '1h 30m',
          icono: 'pi pi-cog',
          productoActual: 'Tablero Eléctrico Industrial',
          unidadesProducidas: 3,
          unidadesTotales: 4
        },
        {
          id: 'MAQ-002',
          nombre: 'Fresadora-A',
          tipo: 'Fresadora',
          estado: 'operativa',
          operario: 'María González',
          ordenCotizacion: 'COT-2025-003',
          numeroOrden: 'ORD-003',
          cliente: 'Constructora Los Andes',
          progreso: 45,
          tiempoInicio: new Date(2025, 11, 5, 9, 0),
          tiempoEstimadoFin: new Date(2025, 11, 5, 17, 30),
          tiempoTranscurrido: '4h 15m',
          tiempoRestante: '4h 45m',
          icono: 'pi pi-wrench',
          productoActual: 'Panel de Control Automático',
          unidadesProducidas: 9,
          unidadesTotales: 20
        },
        {
          id: 'MAQ-003',
          nombre: 'Soldadora-1',
          tipo: 'Soldadora TIG',
          estado: 'operativa',
          operario: 'Carlos Rodríguez',
          ordenCotizacion: 'COT-2025-005',
          numeroOrden: 'ORD-005',
          cliente: 'Minera del Sur',
          progreso: 90,
          tiempoInicio: new Date(2025, 11, 5, 7, 30),
          tiempoEstimadoFin: new Date(2025, 11, 5, 15, 0),
          tiempoTranscurrido: '7h 0m',
          tiempoRestante: '30m',
          icono: 'pi pi-bolt',
          productoActual: 'Estructura Metálica para Torres',
          unidadesProducidas: 18,
          unidadesTotales: 20
        },
        {
          id: 'MAQ-004',
          nombre: 'Prensa-B',
          tipo: 'Prensa Hidráulica',
          estado: 'en-pausa',
          operario: 'Luis Mendoza',
          ordenCotizacion: 'COT-2025-002',
          numeroOrden: 'ORD-002',
          cliente: 'Textil Perú SA',
          progreso: 60,
          tiempoInicio: new Date(2025, 11, 5, 8, 30),
          tiempoEstimadoFin: new Date(2025, 11, 5, 14, 30),
          tiempoTranscurrido: '4h 0m',
          tiempoRestante: '2h 0m',
          icono: 'pi pi-arrows-v',
          productoActual: 'Carcasa Protectora',
          unidadesProducidas: 12,
          unidadesTotales: 20
        },
        {
          id: 'MAQ-005',
          nombre: 'Cortadora Láser',
          tipo: 'Cortadora',
          estado: 'operativa',
          operario: 'Ana Torres',
          ordenCotizacion: 'COT-2025-007',
          numeroOrden: 'ORD-007',
          cliente: 'Metalmecánica Express',
          progreso: 30,
          tiempoInicio: new Date(2025, 11, 5, 10, 0),
          tiempoEstimadoFin: new Date(2025, 11, 5, 18, 0),
          tiempoTranscurrido: '3h 15m',
          tiempoRestante: '4h 45m',
          icono: 'pi pi-exclamation-triangle',
          productoActual: 'Placas Conductoras',
          unidadesProducidas: 15,
          unidadesTotales: 50
        },
        {
          id: 'MAQ-006',
          nombre: 'Taladro-C',
          tipo: 'Taladro Industrial',
          estado: 'mantenimiento',
          operario: 'Técnico Mantenimiento',
          ordenCotizacion: 'N/A',
          numeroOrden: 'N/A',
          cliente: 'N/A',
          progreso: 0,
          tiempoInicio: new Date(2025, 11, 5, 6, 0),
          tiempoEstimadoFin: new Date(2025, 11, 5, 12, 0),
          tiempoTranscurrido: '7h 15m',
          tiempoRestante: 'Indeterminado',
          icono: 'pi pi-wrench',
          productoActual: 'Mantenimiento Preventivo',
          unidadesProducidas: 0,
          unidadesTotales: 0
        },
        {
          id: 'MAQ-007',
          nombre: 'Dobladora-2',
          tipo: 'Dobladora',
          estado: 'operativa',
          operario: 'Pedro Sánchez',
          ordenCotizacion: 'COT-2025-004',
          numeroOrden: 'ORD-004',
          cliente: 'Obras Civiles SAC',
          progreso: 55,
          tiempoInicio: new Date(2025, 11, 5, 9, 30),
          tiempoEstimadoFin: new Date(2025, 11, 5, 16, 30),
          tiempoTranscurrido: '3h 45m',
          tiempoRestante: '3h 15m',
          icono: 'pi pi-angle-double-right',
          productoActual: 'Rieles Metálicos',
          unidadesProducidas: 11,
          unidadesTotales: 20
        },
        {
          id: 'MAQ-008',
          nombre: 'Esmeriladora-A',
          tipo: 'Esmeriladora',
          estado: 'detenida',
          operario: 'Sin asignar',
          ordenCotizacion: 'N/A',
          numeroOrden: 'N/A',
          cliente: 'N/A',
          progreso: 0,
          tiempoInicio: new Date(2025, 11, 5, 0, 0),
          tiempoEstimadoFin: new Date(2025, 11, 5, 0, 0),
          tiempoTranscurrido: '0h 0m',
          tiempoRestante: 'N/A',
          icono: 'pi pi-circle',
          productoActual: 'Sin orden asignada',
          unidadesProducidas: 0,
          unidadesTotales: 0
        },
        {
          id: 'MAQ-009',
          nombre: 'Robot Soldador',
          tipo: 'Robot Automatizado',
          estado: 'operativa',
          operario: 'Sistema Automático',
          ordenCotizacion: 'COT-2025-006',
          numeroOrden: 'ORD-006',
          cliente: 'Automotriz del Perú',
          progreso: 85,
          tiempoInicio: new Date(2025, 11, 5, 6, 0),
          tiempoEstimadoFin: new Date(2025, 11, 5, 14, 0),
          tiempoTranscurrido: '7h 15m',
          tiempoRestante: '45m',
          icono: 'pi pi-android',
          productoActual: 'Componentes Automotrices',
          unidadesProducidas: 170,
          unidadesTotales: 200
        }
      ];

      this.loading = false;
      this.actualizarTiempos();
    }, 800);
  }

  /**
   * Actualizar tiempos transcurridos y restantes
   */
  actualizarTiempos(): void {
    const ahora = new Date();

    this.maquinarias.forEach(maq => {
      if (maq.estado === 'operativa' || maq.estado === 'en-pausa') {
        // Calcular tiempo transcurrido
        const diffInicio = ahora.getTime() - maq.tiempoInicio.getTime();
        const horasTranscurridas = Math.floor(diffInicio / (1000 * 60 * 60));
        const minutosTranscurridos = Math.floor((diffInicio % (1000 * 60 * 60)) / (1000 * 60));
        maq.tiempoTranscurrido = `${horasTranscurridas}h ${minutosTranscurridos}m`;

        // Calcular tiempo restante
        const diffFin = maq.tiempoEstimadoFin.getTime() - ahora.getTime();
        if (diffFin > 0) {
          const horasRestantes = Math.floor(diffFin / (1000 * 60 * 60));
          const minutosRestantes = Math.floor((diffFin % (1000 * 60 * 60)) / (1000 * 60));
          maq.tiempoRestante = `${horasRestantes}h ${minutosRestantes}m`;
        } else {
          maq.tiempoRestante = 'Retrasado';
        }
      }
    });
  }

  /**
   * Obtener maquinarias filtradas
   */
  get maquinariasFiltradas(): Maquinaria[] {
    let resultado = this.maquinarias;

    // Filtrar por estado
    if (this.filtroEstado && this.filtroEstado !== 'todas') {
      resultado = resultado.filter(m => m.estado === this.filtroEstado);
    }

    // Filtrar por búsqueda
    if (this.filtroBusqueda) {
      const busqueda = this.filtroBusqueda.toLowerCase();
      resultado = resultado.filter(m =>
        m.id.toLowerCase().includes(busqueda) ||
        m.nombre.toLowerCase().includes(busqueda) ||
        m.operario.toLowerCase().includes(busqueda) ||
        m.cliente.toLowerCase().includes(busqueda) ||
        m.numeroOrden.toLowerCase().includes(busqueda)
      );
    }

    return resultado;
  }

  /**
   * Obtener severidad del tag según estado
   */
  getEstadoSeverity(estado: string): string {
    switch (estado) {
      case 'operativa': return 'success';
      case 'mantenimiento': return 'warning';
      case 'detenida': return 'danger';
      case 'en-pausa': return 'info';
      default: return 'secondary';
    }
  }

  /**
   * Obtener etiqueta del estado
   */
  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'operativa': return 'Operativa';
      case 'mantenimiento': return 'Mantenimiento';
      case 'detenida': return 'Detenida';
      case 'en-pausa': return 'En Pausa';
      default: return estado;
    }
  }

  /**
   * Ver detalle de maquinaria
   */
  verDetalle(maquinaria: Maquinaria): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Detalle de Maquinaria',
      detail: `${maquinaria.nombre} - ${maquinaria.operario}`,
      life: 3000
    });
  }

  /**
   * Pausar producción
   */
  pausarProduccion(maquinaria: Maquinaria): void {
    if (maquinaria.estado === 'operativa') {
      maquinaria.estado = 'en-pausa';
      this.messageService.add({
        severity: 'info',
        summary: 'Producción Pausada',
        detail: `${maquinaria.nombre} ha sido pausada`,
        life: 3000
      });
    }
  }

  /**
   * Reanudar producción
   */
  reanudarProduccion(maquinaria: Maquinaria): void {
    if (maquinaria.estado === 'en-pausa') {
      maquinaria.estado = 'operativa';
      this.messageService.add({
        severity: 'success',
        summary: 'Producción Reanudada',
        detail: `${maquinaria.nombre} ha sido reanudada`,
        life: 3000
      });
    }
  }

  /**
   * Detener producción
   */
  detenerProduccion(maquinaria: Maquinaria): void {
    maquinaria.estado = 'detenida';
    maquinaria.progreso = 0;
    this.messageService.add({
      severity: 'warn',
      summary: 'Producción Detenida',
      detail: `${maquinaria.nombre} ha sido detenida`,
      life: 3000
    });
  }

  /**
   * Cambiar vista
   */
  cambiarVista(vista: 'grid' | 'lista'): void {
    this.vistaActual = vista;
  }

  /**
   * Refrescar datos
   */
  refrescar(): void {
    this.loading = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Actualizando',
      detail: 'Refrescando datos de producción...',
      life: 2000
    });

    setTimeout(() => {
      this.actualizarTiempos();
      this.loading = false;
    }, 1000);
  }

  /**
   * Obtener estadísticas generales
   */
  get estadisticas() {
    return {
      total: this.maquinarias.length,
      operativas: this.maquinarias.filter(m => m.estado === 'operativa').length,
      pausadas: this.maquinarias.filter(m => m.estado === 'en-pausa').length,
      mantenimiento: this.maquinarias.filter(m => m.estado === 'mantenimiento').length,
      detenidas: this.maquinarias.filter(m => m.estado === 'detenida').length,
      progresoPromedio: Math.round(
        this.maquinarias.reduce((sum, m) => sum + m.progreso, 0) / this.maquinarias.length
      )
    };
  }
}
