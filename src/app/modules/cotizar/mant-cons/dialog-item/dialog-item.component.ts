import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { CotizacionService } from '../../../../service/cotizacion.service';
import { Servicio, ApiResponse, ItemCotizacion } from '../../../cotizar/interface/cotizacion.interface';

@Component({
  selector: 'app-dialog-item',
  standalone: false,
  templateUrl: './dialog-item.component.html',
  styleUrl: './dialog-item.component.css'
})
export class DialogItemComponent implements OnInit {

  // Formulario
  agregarItemForm!: FormGroup;

  // Estados
  loading = false;
  guardandoItem = false;

  // Servicios y sugerencias
  servicios: Servicio[] = [];
  serviciosSugeridos: Servicio[] = [];
  servicioSeleccionado: Servicio | null = null;

  // Configuración del diálogo
  modoEdicion = false;
  itemExistente: ItemCotizacion | null = null;

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private cotizacionService: CotizacionService,
    private messageService: MessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadConfiguracion();
    this.loadServicios();
  }

  /**
   * Inicializar formulario
   */
  private initForm(): void {
    this.agregarItemForm = this.fb.group({
      servicioId: [null],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  /**
   * Cargar configuración del diálogo
   */
  private loadConfiguracion(): void {
    if (this.config.data) {
      this.modoEdicion = this.config.data.modoEdicion || false;
      this.itemExistente = this.config.data.item || null;
      this.servicios = this.config.data.servicios || [];

      // Si es modo edición, cargar datos del item
      if (this.modoEdicion && this.itemExistente) {
        this.agregarItemForm.patchValue({
          servicioId: this.itemExistente.servicioId || null,
          cantidad: this.itemExistente.cantidad || 1,
          descripcion: this.itemExistente.descripcion || '',
          precioUnitario: this.itemExistente.precioUnitario || 0
        });

        // Si hay un servicio asociado, cargarlo
        if (this.itemExistente.servicioId) {
          const servicio = this.servicios.find(s => s.id === this.itemExistente!.servicioId);
          if (servicio) {
            this.servicioSeleccionado = servicio;
          }
        }
      }
    }
  }

  /**
   * Cargar servicios si no se proporcionaron
   */
  private loadServicios(): void {
    if (!this.servicios || this.servicios.length === 0) {
      this.cotizacionService.getServicios().subscribe({
        next: (response: ApiResponse<Servicio[]>) => {
          if (response.success) {
            this.servicios = response.data || [];
          }
        },
        error: (error) => {
          console.error('Error al cargar servicios:', error);
        }
      });
    }
  }

  /**
   * Buscar servicios con autoComplete
   */
  buscarServicios(event: any): void {
    const query = event.query;
    if (query && query.length >= 1) {
      this.cotizacionService.buscarServiciosPorDescripcion(query).subscribe({
        next: (response: ApiResponse<Servicio[]>) => {
          if (response.success) {
            this.serviciosSugeridos = response.data || [];
          }
        },
        error: (error: any) => {
          console.error('Error al buscar servicios:', error);
          this.serviciosSugeridos = [];
        }
      });
    } else {
      this.serviciosSugeridos = [];
    }
  }

  /**
   * Cuando se selecciona un servicio del dropdown
   */
  onServicioSeleccionado(event: any): void {
    const servicio: Servicio = event.value || event;
    this.servicioSeleccionado = servicio;
    this.agregarItemForm.patchValue({
      servicioId: servicio.id,
      descripcion: servicio.descripcion,
      precioUnitario: parseFloat(servicio.precio)
    });
  }

  /**
   * Cuando se cambia el ID del servicio manualmente
   */
  onServicioIdChange(event: any): void {
    const servicioId = event.value;
    if (servicioId && servicioId > 0) {
      // Buscar el servicio por ID
      this.cotizacionService.getServicioPorId(servicioId).subscribe({
        next: (response: ApiResponse<Servicio>) => {
          if (response.success && response.data) {
            this.servicioSeleccionado = response.data;
            this.agregarItemForm.patchValue({
              descripcion: response.data.descripcion,
              precioUnitario: parseFloat(response.data.precio)
            }, { emitEvent: false });
          }
        },
        error: (error: any) => {
          console.error('Error al obtener servicio por ID:', error);
          this.servicioSeleccionado = null;
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: `No se encontró un servicio con el ID ${servicioId}`
          });
        }
      });
    } else if (servicioId === null || servicioId === 0) {
      this.servicioSeleccionado = null;
    }
  }

  /**
   * Cuando se limpia el campo de descripción
   */
  onDescripcionClear(): void {
    this.servicioSeleccionado = null;
    this.agregarItemForm.patchValue({
      servicioId: null
    }, { emitEvent: false });
  }

  /**
   * Cuando se hace clic en el dropdown para mostrar todos los servicios
   */
  onDropdownClick(): void {
    setTimeout(() => {
      if (this.servicios && this.servicios.length > 0) {
        this.serviciosSugeridos = [...this.servicios];
      } else {
        this.cotizacionService.getServicios().subscribe({
          next: (response: ApiResponse<Servicio[]>) => {
            if (response.success) {
              this.serviciosSugeridos = response.data || [];
              this.servicios = response.data || [];
            }
          },
          error: (error: any) => {
            console.error('Error al cargar servicios:', error);
            this.serviciosSugeridos = [];
          }
        });
      }
    }, 10);
  }

  /**
   * Calcular total del item
   */
  calcularTotalItem(): number {
    if (!this.agregarItemForm) return 0;
    const cantidad = this.agregarItemForm.get('cantidad')?.value || 0;
    const precio = this.agregarItemForm.get('precioUnitario')?.value || 0;
    return cantidad * precio;
  }

  /**
   * Confirmar y cerrar el diálogo
   */
  confirmar(): void {
    if (this.agregarItemForm.valid) {
      this.guardandoItem = true;

      const item: ItemCotizacion = {
        servicioId: this.agregarItemForm.get('servicioId')?.value || this.servicioSeleccionado?.id || undefined,
        numeroItem: this.itemExistente?.numeroItem || 1,
        cantidad: this.agregarItemForm.get('cantidad')?.value,
        descripcion: this.agregarItemForm.get('descripcion')?.value,
        precioUnitario: this.agregarItemForm.get('precioUnitario')?.value,
        total: this.calcularTotalItem()
      };

      // Simular un pequeño delay para mostrar el loading
      setTimeout(() => {
        this.guardandoItem = false;
        this.ref.close({
          action: this.modoEdicion ? 'editar' : 'agregar',
          item: item
        });
      }, 500);
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  /**
   * Cancelar y cerrar el diálogo
   */
  cancelar(): void {
    this.ref.close({ action: 'cancelar' });
  }

  /**
   * Marcar todos los controles como tocados
   */
  private markFormGroupTouched(): void {
    Object.keys(this.agregarItemForm.controls).forEach(key => {
      const control = this.agregarItemForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtener título del diálogo
   */
  get tituloDialogo(): string {
    return this.modoEdicion ? 'Editar Item de la Cotización' : 'Agregar Item a la Cotización';
  }

  /**
   * Obtener label del botón principal
   */
  get labelBotonPrincipal(): string {
    return this.modoEdicion ? 'Actualizar Item' : 'Agregar Item';
  }

  /**
   * Obtener icono del botón principal
   */
  get iconoBotonPrincipal(): string {
    return this.modoEdicion ? 'pi pi-check' : 'pi pi-plus';
  }
}
