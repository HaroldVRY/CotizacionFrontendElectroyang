import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';

import { CotizacionService } from '../../../service/cotizacion.service';
import {
  Cotizacion,
  ItemCotizacion,
  Cliente,
  Servicio,
  CreateCotizacionRequest
} from '../../../interface/cotizacion.interface';

@Component({
  selector: 'app-detalle-creacion1',
  standalone: false,
  templateUrl: './detalle-creacion1.component.html',
  styleUrl: './detalle-creacion1.component.css'
})
export class DetalleCreacion1Component implements OnInit, OnDestroy {
  // Forms
  cotizacionForm!: FormGroup;

  // Data
  cotizacion: Cotizacion | null = null;
  clientes: Cliente[] = [];
  servicios: Servicio[] = [];

  // Modo de operación
  modo: 'crear' | 'editar' | 'ver' | 'duplicar' = 'crear';
  cotizacionId: string | null = null;

  // Estados
  loading = false;
  saving = false;

  // Opciones
  formasPago = [
    { label: 'Contado', value: 'contado' },
    { label: '30 días', value: '30_dias' },
    { label: '60 días', value: '60_dias' },
    { label: '90 días', value: '90_dias' }
  ];

  tiemposEntrega = [
    { label: '24 horas', value: '24_horas' },
    { label: '3 días', value: '3_dias' },
    { label: '1 semana', value: '1_semana' },
    { label: '2 semanas', value: '2_semanas' },
    { label: '1 mes', value: '1_mes' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public cotizacionService: CotizacionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    // Obtener parámetros de la ruta
    this.route.queryParams.subscribe(params => {
      this.cotizacionId = params['id'] || null;
      this.modo = params['modo'] || 'crear';

      if (this.cotizacionId) {
        this.loadCotizacion();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializar formulario
   */
  private initForm(): void {
    this.cotizacionForm = this.fb.group({
      numero: ['', Validators.required],
      fecha: [new Date(), Validators.required],
      cliente: ['', Validators.required],
      receptor: ['', Validators.required],
      observaciones: [''],
      tiempoEntrega: ['', Validators.required],
      formaPago: ['', Validators.required],
      mostrarDatosBancarios: [false],
      banco: this.fb.group({
        nombre: [''],
        cuentaCorriente: [''],
        cuentaInterbancaria: ['']
      }),
      items: this.fb.array([])
    });

    // Generar número automático para nuevas cotizaciones
    if (this.modo === 'crear') {
      this.cotizacionForm.patchValue({
        numero: this.cotizacionService.generarNumeroCotizacion()
      });
    }

    // Agregar primer item
    this.agregarItem();
  }

  /**
   * Configurar suscripciones del formulario
   */
  private setupFormSubscriptions(): void {
    // Recalcular totales cuando cambian los items
    this.itemsFormArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalcularTotales();
      });

    // Validar datos bancarios cuando se activa la opción
    this.cotizacionForm.get('mostrarDatosBancarios')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(mostrar => {
        const bancoGroup = this.cotizacionForm.get('banco');
        if (mostrar) {
          bancoGroup?.get('nombre')?.setValidators([Validators.required]);
          bancoGroup?.get('cuentaCorriente')?.setValidators([Validators.required]);
          bancoGroup?.get('cuentaInterbancaria')?.setValidators([Validators.required]);
        } else {
          bancoGroup?.get('nombre')?.clearValidators();
          bancoGroup?.get('cuentaCorriente')?.clearValidators();
          bancoGroup?.get('cuentaInterbancaria')?.clearValidators();
        }
        bancoGroup?.updateValueAndValidity();
      });
  }

  /**
   * Cargar datos iniciales
   */
  private loadInitialData(): void {
    // Cargar clientes
    this.cotizacionService.getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.clientes = response.data || [];
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se pudieron cargar los clientes'
          });
        }
      });

    // Cargar servicios
    this.cotizacionService.getServicios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.servicios = response.data || [];
        },
        error: (error) => {
          console.error('Error al cargar servicios:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se pudieron cargar los servicios'
          });
        }
      });
  }

  /**
   * Cargar cotización existente
   */
  private loadCotizacion(): void {
    if (!this.cotizacionId) return;

    this.loading = true;
    this.cotizacionService.getCotizacionById(this.cotizacionId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.cotizacion = response.data;
            this.loadCotizacionToForm(this.cotizacion);
          }
        },
        error: (error) => {
          console.error('Error al cargar cotización:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la cotización'
          });
          this.router.navigate(['/mantenimiento-consulta/lista-inicio']);
        }
      });
  }

  /**
   * Cargar cotización al formulario
   */
  private loadCotizacionToForm(cotizacion: Cotizacion): void {
    // Limpiar items existentes
    this.clearItems();

    // Si es modo duplicar, generar nuevo número
    const numero = this.modo === 'duplicar'
      ? this.cotizacionService.generarNumeroCotizacion()
      : cotizacion.numero;

    // Cargar datos generales
    this.cotizacionForm.patchValue({
      numero: numero,
      fecha: new Date(cotizacion.fecha),
      cliente: cotizacion.cliente,
      receptor: cotizacion.receptor,
      observaciones: cotizacion.observaciones || '',
      tiempoEntrega: cotizacion.tiempoEntrega,
      formaPago: cotizacion.formaPago,
      mostrarDatosBancarios: !!cotizacion.banco,
      banco: cotizacion.banco || {}
    });

    // Cargar items
    cotizacion.items.forEach(item => {
      this.agregarItem(item);
    });

    // Deshabilitar formulario si es modo ver
    if (this.modo === 'ver') {
      this.cotizacionForm.disable();
    }
  }

  // ===== GESTIÓN DE ITEMS =====

  get itemsFormArray(): FormArray {
    return this.cotizacionForm.get('items') as FormArray;
  }

  /**
   * Crear FormGroup para un item
   */
  private createItemFormGroup(item?: ItemCotizacion): FormGroup {
    return this.fb.group({
      numeroItem: [item?.numeroItem || this.itemsFormArray.length + 1],
      cantidad: [item?.cantidad || 1, [Validators.required, Validators.min(1)]],
      descripcion: [item?.descripcion || '', Validators.required],
      precioUnitario: [item?.precioUnitario || 0, [Validators.required, Validators.min(0)]]
    });
  }

  /**
   * Agregar nuevo item
   */
  agregarItem(item?: ItemCotizacion): void {
    const itemFormGroup = this.createItemFormGroup(item);
    this.itemsFormArray.push(itemFormGroup);
  }

  /**
   * Eliminar item
   */
  eliminarItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
      this.actualizarNumerosItems();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe mantener al menos un item'
      });
    }
  }

  /**
   * Limpiar todos los items
   */
  private clearItems(): void {
    while (this.itemsFormArray.length !== 0) {
      this.itemsFormArray.removeAt(0);
    }
  }

  /**
   * Actualizar números de items
   */
  private actualizarNumerosItems(): void {
    this.itemsFormArray.controls.forEach((control, index) => {
      control.get('numeroItem')?.setValue(index + 1);
    });
  }

  /**
   * Calcular total de un item
   */
  calcularTotalItem(index: number): number {
    const item = this.itemsFormArray.at(index);
    const cantidad = item.get('cantidad')?.value || 0;
    const precio = item.get('precioUnitario')?.value || 0;
    return this.cotizacionService.calcularTotalItem(cantidad, precio);
  }

  /**
   * Recalcular totales generales
   */
  private recalcularTotales(): void {
    const items = this.itemsFormArray.value;
    const total = this.cotizacionService.calcularTotalCotizacion(items);

    // Actualizar vista (se puede mostrar en el template)
    this.cotizacionForm.patchValue({
      precioTotal: total
    }, { emitEvent: false });
  }

  /**
   * Obtener total general
   */
  get totalGeneral(): number {
    return this.cotizacionService.calcularTotalCotizacion(this.itemsFormArray.value);
  }

  /**
   * Obtener total formateado
   */
  get totalGeneralFormateado(): string {
    return this.cotizacionService.formatearPrecio(this.totalGeneral);
  }

  // ===== ACCIONES =====

  /**
   * Guardar cotización
   */
  guardarCotizacion(): void {
    if (this.cotizacionForm.invalid) {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    this.saving = true;
    const formValue = this.cotizacionForm.value;

    const request: CreateCotizacionRequest = {
      cliente: formValue.cliente,
      receptor: formValue.receptor,
      items: formValue.items,
      observaciones: formValue.observaciones,
      tiempoEntrega: formValue.tiempoEntrega,
      formaPago: formValue.formaPago,
      banco: formValue.mostrarDatosBancarios ? formValue.banco : undefined,
      mostrarDatosBancarios: formValue.mostrarDatosBancarios
    };

    const action$ = this.modo === 'editar' && this.cotizacionId
      ? this.cotizacionService.updateCotizacion(this.cotizacionId, request)
      : this.cotizacionService.createCotizacion(request);

    action$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving = false)
      )
      .subscribe({
        next: (response) => {
          const mensaje = this.modo === 'editar' ? 'actualizada' : 'creada';
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Cotización ${mensaje} correctamente`
          });

          // Navegar a la lista
          setTimeout(() => {
            this.router.navigate(['/mantenimiento-consulta/lista-inicio']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error al guardar cotización:', error);
        }
      });
  }

  /**
   * Cancelar edición
   */
  cancelar(): void {
    if (this.cotizacionForm.dirty) {
      this.confirmationService.confirm({
        message: '¿Está seguro de cancelar? Se perderán los cambios no guardados.',
        header: 'Confirmar Cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí',
        rejectLabel: 'No',
        accept: () => {
          this.router.navigate(['/mantenimiento-consulta/lista-inicio']);
        }
      });
    } else {
      this.router.navigate(['/mantenimiento-consulta/lista-inicio']);
    }
  }

  /**
   * Generar vista previa
   */
  vistaPrevia(): void {
    if (this.cotizacionId) {
      this.cotizacionService.generarReporte(this.cotizacionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            window.URL.revokeObjectURL(url);
          },
          error: (error) => {
            console.error('Error al generar vista previa:', error);
          }
        });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe guardar la cotización antes de generar vista previa'
      });
    }
  }

  // ===== UTILIDADES =====

  /**
   * Marcar todos los controles como tocados
   */
  private markFormGroupTouched(): void {
    this.cotizacionForm.markAllAsTouched();
    this.itemsFormArray.controls.forEach(control => {
      control.markAllAsTouched();
    });
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.cotizacionForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.touched && field.hasError(errorType);
    }
    return field.touched && field.invalid;
  }

  /**
   * Verificar si un item tiene error
   */
  hasItemFieldError(itemIndex: number, fieldName: string, errorType?: string): boolean {
    const field = this.itemsFormArray.at(itemIndex).get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.touched && field.hasError(errorType);
    }
    return field.touched && field.invalid;
  }

  /**
   * Obtener título de la página
   */
  get pageTitle(): string {
    switch (this.modo) {
      case 'crear': return 'Nueva Cotización';
      case 'editar': return 'Editar Cotización';
      case 'ver': return 'Ver Cotización';
      case 'duplicar': return 'Duplicar Cotización';
      default: return 'Cotización';
    }
  }

  /**
   * Verificar si es modo solo lectura
   */
  get isReadOnly(): boolean {
    return this.modo === 'ver';
  }
}
