import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ServicioService } from '../../../../service/servicio.service';
import { Servicio } from '../../interface/cotizacion.interface';

@Component({
  selector: 'app-detalle-servicios',
  standalone: false,
  templateUrl: './detalle-servicios.component.html',
  styleUrl: './detalle-servicios.component.css'
})
export class DetalleServiciosComponent implements OnInit, OnDestroy {
  servicioForm!: FormGroup;
  servicio: Servicio | null = null;
  servicioId: number | null = null;
  modo: 'crear' | 'editar' | 'ver' = 'ver';
  isReadOnly: boolean = true;
  loading: boolean = false;
  saving: boolean = false;

  // Opciones para el dropdown de estado
  estadoOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private servicioService: ServicioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id === 'nuevo') {
        this.modo = 'crear';
        this.isReadOnly = false;
        this.servicioId = null;
        this.servicio = null;
        this.resetForm();
      } else if (id) {
        this.servicioId = parseInt(id, 10);
        this.modo = 'ver';
        this.isReadOnly = true;
        this.cargarServicio();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Título de la página según el modo
   */
  get pageTitle(): string {
    switch (this.modo) {
      case 'crear':
        return 'Nuevo';
      case 'editar':
        return 'Editando';
      case 'ver':
        return 'Servicio:';
      default:
        return 'Servicio';
    }
  }

  /**
   * Inicializar formulario
   */
  private initializeForm(): void {
    this.servicioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      unidad: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]],
      activo: [true]
    });
  }

  /**
   * Cargar servicio por ID
   */
  private cargarServicio(): void {
    if (!this.servicioId) return;

    this.loading = true;

    this.servicioService.getServicioById(this.servicioId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.servicio = response.data;
            this.cargarDatosEnFormulario();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cargar el servicio'
            });
            this.cancelar();
          }
        },
        error: (error: any) => {
          console.error('Error al cargar servicio:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el servicio'
          });
          this.cancelar();
        }
      });
  }

  /**
   * Cargar datos del servicio en el formulario
   */
  private cargarDatosEnFormulario(): void {
    if (this.servicio) {
      this.servicioForm.patchValue({
        nombre: this.servicio.nombre,
        descripcion: this.servicio.descripcion,
        precio: parseFloat(this.servicio.precio),
        unidad: this.servicio.unidad,
        activo: this.servicio.activo
      });
    }
  }

  /**
   * Resetear formulario
   */
  private resetForm(): void {
    this.servicioForm.reset();
    // Establecer valores por defecto para evitar campos null
    this.servicioForm.patchValue({
      nombre: '',
      descripcion: '',
      precio: 0,
      unidad: '',
      activo: true
    });
    this.servicio = null;
  }

  /**
   * Cambiar a modo edición
   */
  editarServicio(): void {
    this.modo = 'editar';
    this.isReadOnly = false;
  }

  /**
   * Guardar servicio (crear o actualizar)
   */
  guardarServicio(): void {
    if (this.servicioForm.invalid) {
      this.markFormGroupTouched();

      // Mostrar errores específicos para ayudar al usuario
      const errores: string[] = [];
      Object.keys(this.servicioForm.controls).forEach(key => {
        const control = this.servicioForm.get(key);
        if (control?.invalid) {
          errores.push(this.getFieldError(key));
        }
      });

      this.messageService.add({
        severity: 'error',
        summary: 'Error de validación',
        detail: errores.length > 0 ? errores.join('. ') : 'Por favor, complete todos los campos requeridos correctamente'
      });
      return;
    }

    this.saving = true;
    const formValue = this.servicioForm.value;

    // Limpiar datos: convertir precio a string como espera la API
    const datosServicio = {
      nombre: formValue.nombre || '',
      descripcion: formValue.descripcion || '',
      precio: formValue.precio.toString(),
      unidad: formValue.unidad || '',
      activo: formValue.activo ?? true
    };

    const operacion = this.modo === 'crear'
      ? this.servicioService.createServicio(datosServicio)
      : this.servicioService.updateServicio(this.servicioId!, datosServicio);

    operacion
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const mensaje = this.modo === 'crear' ? 'Servicio creado exitosamente' : 'Servicio actualizado exitosamente';
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: mensaje
            });

            if (this.modo === 'crear') {
              // Redirigir al detalle del servicio recién creado
              this.router.navigate(['/cotizar/servicios', response.data.id]);
            } else {
              // Actualizar datos y cambiar a modo ver
              this.servicio = response.data;
              this.cargarDatosEnFormulario();
              this.modo = 'ver';
              this.isReadOnly = true;
            }
          }
        },
        error: (error: any) => {
          console.error('Error al guardar servicio:', error);

          let errorMessage = 'Error al guardar el servicio';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
      });
  }

  /**
   * Eliminar servicio
   */
  eliminarServicio(): void {
    if (!this.servicioId) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el servicio "${this.servicio?.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.loading = true;

        this.servicioService.deleteServicio(this.servicioId!)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
          )
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Servicio eliminado exitosamente'
                });
                this.router.navigate(['/cotizar/servicios']);
              }
            },
            error: (error: any) => {
              console.error('Error al eliminar servicio:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el servicio'
              });
            }
          });
      }
    });
  }

  /**
   * Cancelar operación
   */
  cancelar(): void {
    if (this.modo === 'crear') {
      this.router.navigate(['/cotizar/servicios']);
    } else if (this.modo === 'editar') {
      // Volver a modo ver y recargar datos originales
      this.modo = 'ver';
      this.isReadOnly = true;
      this.cargarDatosEnFormulario();
    } else {
      this.router.navigate(['/cotizar/servicios']);
    }
  }

  /**
   * Formatear precio para mostrar
   */
  formatearPrecio(precio: string | number): string {
    const precioNumero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(precioNumero);
  }

  /**
   * Marcar todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.servicioForm.controls).forEach(key => {
      const control = this.servicioForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.servicioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.servicioForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  /**
   * Obtener etiqueta del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      descripcion: 'Descripción',
      precio: 'Precio',
      unidad: 'Unidad',
      activo: 'Estado'
    };
    return labels[fieldName] || fieldName;
  }
}
