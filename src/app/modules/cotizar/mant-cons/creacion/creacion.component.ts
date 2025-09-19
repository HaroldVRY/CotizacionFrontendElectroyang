import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CotizacionService } from '../../../../service/cotizacion.service';
import {Cotizacion,ItemCotizacion,Cliente,Servicio,CreateCotizacionRequest,ApiResponse} from '../../../../modules/cotizar/interface/cotizacion.interface';


@Component({
  selector: 'app-creacion',
  standalone: false,
  templateUrl: './creacion.component.html',
  styleUrl: './creacion.component.css'
})
export class CreacionComponent implements OnInit, OnDestroy {
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

  // Propiedades para el modal de agregar/editar item
  mostrarDialogoAgregarItem = false;
  agregarItemForm!: FormGroup;
  serviciosSugeridos: Servicio[] = [];
  servicioSeleccionado: Servicio | null = null;
  guardandoItem = false;

  // Propiedades para el modo de edición
  modoEdicion = false;
  itemEditandoIndex: number = -1;

  // Propiedades para las tabs
  activeTab: string = '0';

  // Opciones
  formasPago = [
    { label: 'Contado', value: 'Contado' },
    { label: 'Transferencia bancaria', value: 'Transferencia bancaria' },
    { label: 'Pago contra entrega', value: 'Pago contra entrega' },
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Crédito 30 días', value: 'Crédito 30 días' }
  ];

  estadosDisponibles = [
    { label: 'Borrador', value: 'borrador' },
    { label: 'Enviada', value: 'enviada' },
    { label: 'Aprobada', value: 'aprobada' },
    { label: 'Rechazada', value: 'rechazada' },
    { label: 'Cancelada', value: 'cancelada' }
  ];



  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public cotizacionService: CotizacionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.inicializarFormularioItem();

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
          this.router.navigate(['/cotizar/mantenimiento-consulta']);
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
      cliente: cotizacion.cliente || cotizacion.clienteNombre,
      receptor: cotizacion.receptor,
      observaciones: cotizacion.observaciones || '',
      tiempoEntrega: cotizacion.tiempoEntrega,
      formaPago: cotizacion.formaPago,
      mostrarDatosBancarios: true, // Mostrar datos bancarios por defecto
      banco: cotizacion.banco || {
        nombre: 'Banco de Crédito del Perú',
        cuentaCorriente: '000-123456789',
        cuentaInterbancaria: '018-000-123456789-01'
      }
    });

    // Cargar items (usar detalles si están disponibles, sino items)
    const itemsACargar = cotizacion.items || cotizacion.detalles || [];
    itemsACargar.forEach(item => {
      // Convertir item del backend al formato del formulario
      const itemFormulario: Partial<ItemCotizacion> = {
        numeroItem: item.numeroItem,
        cantidad: item.cantidadNumeric || this.convertirANumero(item.cantidad),
        descripcion: item.descripcion,
        precioUnitario: item.precioUnitarioNumeric || this.convertirANumero(item.precioUnitario),
        total: item.totalNumeric || this.convertirANumero(item.total)
      };
      this.agregarItem(itemFormulario as ItemCotizacion);
    });

    // Si no hay items, agregar uno vacío
    if (itemsACargar.length === 0) {
      this.agregarItem();
    }

    // Deshabilitar formulario si es modo ver
    if (this.modo === 'ver') {
      this.cotizacionForm.disable();
    }
  }  // ===== GESTIÓN DE ITEMS =====

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
   * Eliminar item del formulario (método para el modo formulario)
   */
  eliminarItemFormulario(index: number): void {
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
   * Calcular total de un item del formulario
   */
  calcularTotalItemFormulario(index: number): number {
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
   * Obtener subtotal (sin IGV)
   */
  get subtotal(): number {
    return this.cotizacionService.calcularTotalCotizacion(this.itemsFormArray.value);
  }

  /**
   * Obtener IGV (18%)
   */
  get igv(): number {
    return this.subtotal * 0.18;
  }

  /**
   * Obtener total general (subtotal + IGV)
   */
  get totalGeneral(): number {
    return this.subtotal + this.igv;
  }

  /**
   * Obtener subtotal formateado
   */
  get subtotalFormateado(): string {
    return this.cotizacionService.formatearPrecio(this.subtotal);
  }

  /**
   * Obtener IGV formateado
   */
  get igvFormateado(): string {
    return this.cotizacionService.formatearPrecio(this.igv);
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
            this.router.navigate(['/cotizar/mantenimiento-consulta']);
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
          this.router.navigate(['/cotizar/mantenimiento-consulta']);
        }
      });
    } else {
      this.router.navigate(['/cotizar/mantenimiento-consulta']);
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
   * Convertir string a número
   */
  private convertirANumero(valor: string | number): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const numero = parseFloat(valor);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

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

  // ===== MÉTODOS PARA GESTIÓN DE ITEMS (MODAL) =====

  /**
   * Inicializar formulario para nuevo item
   */
  inicializarFormularioItem(): void {
    this.agregarItemForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  /**
   * Abrir modal para agregar item
   */
  abrirDialogoAgregarItem(): void {
    this.modoEdicion = false;
    this.itemEditandoIndex = -1;
    this.mostrarDialogoAgregarItem = true;
    this.servicioSeleccionado = null;
    this.agregarItemForm.reset({
      cantidad: 1,
      descripcion: '',
      precioUnitario: 0
    });
    this.serviciosSugeridos = [];
  }

  /**
   * Editar item existente
   */
  editarItem(index: number): void {
    if (this.modo === 'ver' || !this.cotizacion?.detalles || !this.cotizacion.detalles[index]) return;

    this.modoEdicion = true;
    this.itemEditandoIndex = index;
    const item = this.cotizacion.detalles[index];

    // Precargar el formulario con los datos del item
    this.agregarItemForm.reset({
      cantidad: item.cantidad || 1,
      descripcion: item.descripcion || '',
      precioUnitario: item.precioUnitario || 0
    });

    // Si hay un servicio asociado, cargarlo
    if (item.servicioId) {
      // Buscar el servicio en la lista cargada
      const servicio = this.servicios.find(s => s.id === item.servicioId);
      if (servicio) {
        this.servicioSeleccionado = servicio;
      }
    } else {
      this.servicioSeleccionado = null;
    }

    this.mostrarDialogoAgregarItem = true;
    this.serviciosSugeridos = [];
  }

  /**
   * Cerrar modal de agregar item
   */
  cerrarDialogoAgregarItem(): void {
    this.mostrarDialogoAgregarItem = false;
    this.agregarItemForm.reset();
    this.servicioSeleccionado = null;
    this.serviciosSugeridos = [];
    this.modoEdicion = false;
    this.itemEditandoIndex = -1;
  }

  /**
   * Buscar servicios con autoComplete
   */
  buscarServicios(event: any): void {
    const query = event.query;
    if (query && query.length >= 1) {
      this.cotizacionService.buscarServicios(query).subscribe({
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
      descripcion: servicio.descripcion,
      precioUnitario: parseFloat(servicio.precio)
    });
  }

  /**
   * Calcular total del item en el modal
   */
  calcularTotalItem(): number {
    if (!this.agregarItemForm) return 0;
    const cantidad = this.agregarItemForm.get('cantidad')?.value || 0;
    const precio = this.agregarItemForm.get('precioUnitario')?.value || 0;
    return cantidad * precio;
  }

  /**
   * Confirmar editar item
   */
  confirmarEditarItem(): void {
    if (this.agregarItemForm.valid && this.cotizacion && this.itemEditandoIndex >= 0) {
      this.guardandoItem = true;

      const itemActualizado: ItemCotizacion = {
        servicioId: this.servicioSeleccionado?.id || undefined,
        numeroItem: this.itemEditandoIndex + 1, // Mantener el número original
        cantidad: this.agregarItemForm.get('cantidad')?.value,
        descripcion: this.agregarItemForm.get('descripcion')?.value,
        precioUnitario: this.agregarItemForm.get('precioUnitario')?.value,
        total: this.calcularTotalItem()
      };

      // Crear una copia de los detalles y actualizar el item en la posición especificada
      const detallesActualizados = [...(this.cotizacion.detalles || [])];
      detallesActualizados[this.itemEditandoIndex] = itemActualizado;

      // Preparar datos para enviar a la API
      const datosActualizados = {
        clienteId: this.cotizacion.clienteId,
        receptor: this.cotizacion.receptor,
        observaciones: this.cotizacion.observaciones,
        tiempoEntrega: this.cotizacion.tiempoEntrega,
        formaPago: this.cotizacion.formaPago,
        estado: this.cotizacion.estado,
        detalles: detallesActualizados
      };

      // Enviar a la API
      this.cotizacionService.actualizarCotizacion(this.cotizacionId!, datosActualizados).subscribe({
        next: (response: ApiResponse<Cotizacion>) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Item actualizado correctamente'
            });
            this.cerrarDialogoAgregarItem();
            // Recargar datos actualizados desde la API
            this.recargarCotizacion();
          }
          this.guardandoItem = false;
        },
        error: (error: any) => {
          console.error('Error al actualizar item:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el item'
          });
          this.guardandoItem = false;
        }
      });
    }
  }

  /**
   * Confirmar agregar item
   */
  confirmarAgregarItem(): void {
    if (this.agregarItemForm.valid && this.cotizacion) {
      this.guardandoItem = true;

      const nuevoItem: ItemCotizacion = {
        servicioId: this.servicioSeleccionado?.id || undefined,
        numeroItem: this.getProximoNumeroItem(),
        cantidad: this.agregarItemForm.get('cantidad')?.value,
        descripcion: this.agregarItemForm.get('descripcion')?.value,
        precioUnitario: this.agregarItemForm.get('precioUnitario')?.value,
        total: this.calcularTotalItem()
      };

      // Crear una copia de los detalles actuales y agregar el nuevo item
      const detallesActualizados = [...(this.cotizacion.detalles || []), nuevoItem];

      // Preparar datos para enviar a la API (sin modificar el estado local aún)
      const datosActualizados = {
        clienteId: this.cotizacion.clienteId,
        receptor: this.cotizacion.receptor,
        observaciones: this.cotizacion.observaciones,
        tiempoEntrega: this.cotizacion.tiempoEntrega,
        formaPago: this.cotizacion.formaPago,
        estado: this.cotizacion.estado,
        detalles: detallesActualizados
      };

      // Enviar a la API
      this.cotizacionService.actualizarCotizacion(this.cotizacionId!, datosActualizados).subscribe({
        next: (response: ApiResponse<Cotizacion>) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Item agregado correctamente'
            });
            this.cerrarDialogoAgregarItem();
            // Recargar datos actualizados desde la API
            this.recargarCotizacion();
          }
          this.guardandoItem = false;
        },
        error: (error: any) => {
          console.error('Error al agregar item:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo agregar el item'
          });
          // No necesitamos revertir cambios locales porque no los hicimos
          this.guardandoItem = false;
        }
      });
    }
  }

  /**
   * Eliminar item (sobrescribir el método existente)
   */
  eliminarItem(index: number): void {
    if (this.modo === 'ver') return;

    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar este item?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        if (this.cotizacion && this.cotizacion.detalles) {
          // Crear una copia del array sin el item eliminado
          const detallesActualizados = this.cotizacion.detalles.filter((_, i) => i !== index);

          // Recalcular números de item en la copia
          detallesActualizados.forEach((item, i) => {
            item.numeroItem = i + 1;
          });

          // Si es una cotización existente, actualizar en la API
          if (this.cotizacionId) {
            const datosActualizados = {
              clienteId: this.cotizacion.clienteId,
              receptor: this.cotizacion.receptor,
              observaciones: this.cotizacion.observaciones,
              tiempoEntrega: this.cotizacion.tiempoEntrega,
              formaPago: this.cotizacion.formaPago,
              estado: this.cotizacion.estado,
              detalles: detallesActualizados
            };            this.cotizacionService.actualizarCotizacion(this.cotizacionId, datosActualizados).subscribe({
              next: (response: ApiResponse<Cotizacion>) => {
                if (response.success) {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Item eliminado correctamente'
                  });
                  // Recargar datos actualizados desde la API
                  this.recargarCotizacion();
                }
              },
              error: (error: any) => {
                console.error('Error al eliminar item:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudo eliminar el item'
                });
                // Recargar datos originales desde la API
                this.recargarCotizacion();
              }
            });
          } else {
            // Si es una nueva cotización, solo actualizar localmente
            this.recalcularTotalesCotizacion();
          }
        }
      }
    });
  }

  /**
   * Obtener próximo número de item
   */
  getProximoNumeroItem(): number {
    if (!this.cotizacion?.detalles || this.cotizacion.detalles.length === 0) {
      return 1;
    }
    return Math.max(...this.cotizacion.detalles.map(item => item.numeroItem)) + 1;
  }

  /**
   * Recalcular totales de la cotización
   */
  recalcularTotalesCotizacion(): void {
    if (this.cotizacion?.detalles) {
      const subtotal = this.cotizacion.detalles.reduce((sum, item) => {
        return sum + (Number(item.cantidad) * Number(item.precioUnitario));
      }, 0);

      const igv = subtotal * 0.18;
      const total = subtotal + igv;

      this.cotizacion.subtotal = subtotal;
      this.cotizacion.igv = igv;
      this.cotizacion.total = total;
      this.cotizacion.precioTotalFormatted = this.cotizacionService.formatearPrecio(total);
    }
  }

  /**
   * Recargar cotización desde la API (sin loading overlay)
   */
  recargarCotizacion(): void {
    if (!this.cotizacionId) return;

    this.cotizacionService.getCotizacionById(this.cotizacionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            // Actualizar solo los datos, mantener el estado del formulario
            const cotizacionActualizada = response.data;

            // Actualizar el objeto cotización con los datos frescos
            this.cotizacion = {
              ...this.cotizacion,
              ...cotizacionActualizada,
              detalles: cotizacionActualizada.detalles || cotizacionActualizada.items || [],
              items: cotizacionActualizada.detalles || cotizacionActualizada.items || []
            };

            // Forzar la detección de cambios en Angular
            this.recalcularTotalesCotizacion();
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error al recargar cotización:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar los datos'
          });
        }
      });
  }

  // ===== MÉTODOS PARA TABS =====

  /**
   * Cambiar tab activa
   */
  onTabChange(event: any): void {
    this.activeTab = event.value || event;
  }

  /**
   * Cargar contenido de tab específica
   */
  loadTab(tabValue: string): void {
    this.activeTab = tabValue;
  }

  /**
   * Verificar si hay datos para mostrar
   */
  get hasData(): boolean {
    return this.cotizacion !== null;
  }

  /**
   * Manejar selección de cliente (método dummy para compatibilidad con template)
   */
  onClienteSeleccionado(): void {
    // Método para compatibilidad con el template
  }
}
