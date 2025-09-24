import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CotizacionService } from '../../../../service/cotizacion.service';
import { ClienteService } from '../../../../service/cliente.service';
import { ServicioService } from '../../../../service/servicio.service';
import { ReporteService } from '../../../../service/reporte.service';
import {Cotizacion,ItemCotizacion,Cliente,Servicio,CreateCotizacionRequest,DetalleItem,ApiResponse} from '../../../../modules/cotizar/interface/cotizacion.interface';


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
  clienteSeleccionado: Cliente | null = null;
  clientesSugeridos: Cliente[] = [];

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
    private clienteService: ClienteService,
    private servicioService: ServicioService,
    private reporteService: ReporteService,
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

      // Asegurar que activeTab esté inicializado
      this.activeTab = '0';

      if (this.cotizacionId) {
        this.loadCotizacion();
      } else {
        // En modo crear, forzar detección de cambios
        this.cdr.detectChanges();
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
      estado: ['borrador', Validators.required],
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

    // No agregar item inicial - se agregará mediante el modal
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

    // Sincronizar selección de cliente cuando cambia el valor
    this.cotizacionForm.get('cliente')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Usar setTimeout para evitar conflictos con la actualización del AutoComplete
        setTimeout(() => {
          this.syncClienteSelection();
        }, 0);
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
    this.clienteService.getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.clientes = response.data || [];
          this.clientesSugeridos = this.clientes; // Inicializar sugerencias
          console.log('📊 Clientes cargados:', this.clientes.length);
          console.log('🔍 Primeros clientes:', this.clientes.slice(0, 3).map(c => c.nombre));
        },
        error: (error: any) => {
          console.error('Error al cargar clientes:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se pudieron cargar los clientes'
          });
        }
      });

    // Cargar servicios
    this.servicioService.getServicios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.servicios = response.data || [];
        },
        error: (error: any) => {
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
      estado: cotizacion.estado || 'borrador',
      mostrarDatosBancarios: true, // Mostrar datos bancarios por defecto
      banco: cotizacion.banco || {
        nombre: 'Banco de Crédito del Perú',
        cuentaCorriente: '000-123456789',
        cuentaInterbancaria: '018-000-123456789-01'
      }
    });

    // Buscar y establecer el cliente seleccionado
    const clienteNombre = cotizacion.cliente || cotizacion.clienteNombre;
    if (clienteNombre) {
      // Esperar a que los clientes estén cargados antes de buscar
      setTimeout(() => {
        this.clienteSeleccionado = this.findClienteByName(clienteNombre);
        this.cdr.detectChanges();
      }, 100);
    }

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

    // No agregar item vacío - solo cargar los items existentes

    // Deshabilitar formulario si es modo ver
    if (this.modo === 'ver') {
      this.cotizacionForm.disable();
    }

    // Forzar detección de cambios y asegurar que activeTab esté establecido
    this.activeTab = '0';
    this.cdr.detectChanges();
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
      servicioId: [item?.servicioId || null],
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
    this.itemsFormArray.removeAt(index);
    this.actualizarNumerosItems();
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

  /**
   * Obtener items para mostrar en la tabla - FormArray en modo crear/editar, cotizacion.items en modo ver
   */
  get itemsParaTabla(): any[] {
    if (this.modo === 'crear' || this.modo === 'duplicar' || (this.modo === 'editar' && this.itemsFormArray.length > 0)) {
      // En modo crear, duplicar o editar con FormArray, usar el FormArray
      return this.itemsFormArray.controls.map((control, index) => {
        const item = control.value;
        return {
          numeroItem: item.numeroItem || (index + 1),
          cantidad: item.cantidad || 0,
          descripcion: item.descripcion || '',
          precioUnitario: item.precioUnitario || 0,
          total: (item.cantidad || 0) * (item.precioUnitario || 0)
        };
      });
    } else if (this.cotizacion) {
      // En modo ver o cuando se carga una cotización existente, usar los datos cargados
      return this.cotizacion.items || this.cotizacion.detalles || [];
    }
    return [];
  }

  /**
   * Obtener subtotal dinámico para mostrar en pantalla
   */
  get subtotalParaMostrar(): number {
    if (this.modo === 'crear' || this.modo === 'duplicar' || (this.modo === 'editar' && this.itemsFormArray.length > 0)) {
      return this.subtotal; // Usa el subtotal calculado del FormArray
    }
    const cotizacionSubtotal = this.cotizacion?.subtotal;
    return typeof cotizacionSubtotal === 'number' ? cotizacionSubtotal : parseFloat(cotizacionSubtotal as string) || 0;
  }

  /**
   * Obtener IGV dinámico para mostrar en pantalla
   */
  get igvParaMostrar(): number {
    if (this.modo === 'crear' || this.modo === 'duplicar' || (this.modo === 'editar' && this.itemsFormArray.length > 0)) {
      return this.igv; // Usa el IGV calculado del FormArray
    }
    const cotizacionIgv = this.cotizacion?.igv;
    return typeof cotizacionIgv === 'number' ? cotizacionIgv : parseFloat(cotizacionIgv as string) || 0;
  }

  /**
   * Obtener total general dinámico para mostrar en pantalla
   */
  get totalGeneralParaMostrar(): number {
    if (this.modo === 'crear' || this.modo === 'duplicar' || (this.modo === 'editar' && this.itemsFormArray.length > 0)) {
      return this.totalGeneral; // Usa el total calculado del FormArray
    }
    return this.cotizacion?.precioTotal || 0;
  }

  /**
   * Obtener total general formateado dinámico para mostrar en pantalla
   */
  get totalGeneralFormateadoParaMostrar(): string {
    if (this.modo === 'crear' || this.modo === 'duplicar' || (this.modo === 'editar' && this.itemsFormArray.length > 0)) {
      return this.cotizacionService.formatearPrecio(this.totalGeneralParaMostrar);
    }
    return this.cotizacion?.precioTotalFormatted || 'S/ 0.00';
  }

  // ===== ACCIONES =====

  /**
   * Guardar cotización
   */
  guardarCotizacion(): void {
    // Marcar todos los controles como tocados para mostrar errores
    this.cotizacionForm.markAllAsTouched();
    this.itemsFormArray.controls.forEach(control => control.markAllAsTouched());

    // Validaciones básicas
    if (this.cotizacionForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Por favor complete todos los campos requeridos.'
      });
      return;
    }

    if (this.itemsFormArray.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Items Requeridos',
        detail: 'Debe agregar al menos un item a la cotización'
      });
      return;
    }

    const formValue = this.cotizacionForm.value;
    const clienteId = this.obtenerClienteId(formValue.cliente);

    if (!clienteId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cliente Requerido',
        detail: 'Debe seleccionar un cliente válido.'
      });
      return;
    }

    this.saving = true;

    // Crear request según estructura esperada por la API
    const request: CreateCotizacionRequest = {
      clienteId: clienteId,
      receptor: formValue.receptor?.trim() || '',
      observaciones: formValue.observaciones?.trim() || '',
      tiempoEntrega: formValue.tiempoEntrega?.trim() || '',
      formaPago: formValue.formaPago?.trim() || '',
      detalles: this.itemsFormArray.value.map((item: any, index: number) => ({
        servicioId: item.servicioId || null,
        numeroItem: index + 1,
        cantidad: Number(item.cantidad) || 1,
        descripcion: item.descripcion || '',
        precioUnitario: Number(item.precioUnitario) || 0
      }))
    };

    const action$ = this.modo === 'editar' && this.cotizacionId
      ? this.cotizacionService.updateCotizacion(this.cotizacionId, request as any)
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

          setTimeout(() => {
            this.router.navigate(['/cotizar/mantenimiento-consulta']);
          }, 1500);
        },
        error: (error) => {
          this.mostrarErrorGuardado(error);
        }
      });
  }

  /**
   * Obtener el ID del cliente de manera confiable
   */
  private obtenerClienteId(cliente: any): number | null {
    // Si tenemos un cliente seleccionado directamente
    if (this.clienteSeleccionado?.id) {
      return this.clienteSeleccionado.id;
    }

    // Si el cliente es un objeto con id
    if (cliente && typeof cliente === 'object' && cliente.id) {
      return cliente.id;
    }

    // Si el cliente es un string, buscar por nombre
    if (typeof cliente === 'string') {
      const clientePorNombre = this.clientes.find(c => c.nombre === cliente);
      return clientePorNombre?.id || null;
    }

    // Si es un número directamente
    if (typeof cliente === 'number') {
      return cliente;
    }

    return null;
  }

  /**
   * Mostrar mensaje de error al guardar
   */
  private mostrarErrorGuardado(error: any): void {
    let mensajeError = 'Error al guardar la cotización';
    let detalle = '';

    if (error?.error?.errors && Array.isArray(error.error.errors)) {
      detalle = error.error.errors.join('\n');
      mensajeError = 'Errores de validación encontrados:';
    } else if (error?.error?.message) {
      detalle = error.error.message;
    } else if (error?.message) {
      detalle = error.message;
    } else {
      detalle = 'Error desconocido. Verifique los datos e intente nuevamente.';
    }

    this.messageService.add({
      severity: 'error',
      summary: mensajeError,
      detail: detalle,
      life: 15000
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
      this.reporteService.generarReporteCotizacion(this.cotizacionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            window.URL.revokeObjectURL(url);
          },
          error: (error: any) => {
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
   * Obtener lista de campos inválidos para debug
   */
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
      servicioId: [null],
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
      servicioId: null,
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
      servicioId: item.servicioId || null,
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
    const query = event.query || '';

    if (query.length >= 1) {
      this.servicioService.getServicios().subscribe({
        next: (response: any) => {
          const servicios = response.data || [];
          this.serviciosSugeridos = servicios.filter((servicio: any) =>
            servicio.descripcion.toLowerCase().includes(query.toLowerCase()) ||
            servicio.nombre.toLowerCase().includes(query.toLowerCase())
          );
        },
        error: (error: any) => {
          console.error('Error al buscar servicios:', error);
          this.serviciosSugeridos = [];
        }
      });
    } else {
      // Mostrar todos los servicios cuando no hay query
      this.serviciosSugeridos = this.servicios.slice(0, 20); // Limitar para mejor rendimiento
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
   * Calcular total del item en el modal
   */
  calcularTotalItem(): number {
    if (!this.agregarItemForm) return 0;
    const cantidad = this.agregarItemForm.get('cantidad')?.value || 0;
    const precio = this.agregarItemForm.get('precioUnitario')?.value || 0;
    return cantidad * precio;
  }

  /**
   * Confirmar editar item - Solo actualiza en el FormArray local, no hace llamadas a la API
   */
  confirmarEditarItem(): void {
    if (this.agregarItemForm.valid && this.itemEditandoIndex >= 0) {
      const itemActualizado: ItemCotizacion = {
        servicioId: this.agregarItemForm.get('servicioId')?.value || null,
        numeroItem: this.itemEditandoIndex + 1, // Mantener el número original
        cantidad: this.agregarItemForm.get('cantidad')?.value,
        descripcion: this.agregarItemForm.get('descripcion')?.value,
        precioUnitario: this.agregarItemForm.get('precioUnitario')?.value,
        total: this.calcularTotalItem()
      };

      // Actualizar el item en el FormArray
      const itemFormGroup = this.fb.group({
        servicioId: [itemActualizado.servicioId],
        numeroItem: [itemActualizado.numeroItem],
        cantidad: [itemActualizado.cantidad, Validators.required],
        descripcion: [itemActualizado.descripcion, Validators.required],
        precioUnitario: [itemActualizado.precioUnitario, [Validators.required, Validators.min(0)]],
        total: [itemActualizado.total]
      });

      // Reemplazar el item en la posición especificada
      this.itemsFormArray.setControl(this.itemEditandoIndex, itemFormGroup);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Item actualizado correctamente'
      });

      this.cerrarDialogoAgregarItem();
      this.recalcularTotales();
    }
  }

  /**
   * Confirmar agregar item - Solo agrega al FormArray local, no hace llamadas a la API
   */
  confirmarAgregarItem(): void {
    if (this.agregarItemForm.valid) {
      const nuevoItem: ItemCotizacion = {
        servicioId: this.agregarItemForm.get('servicioId')?.value || null,
        numeroItem: this.itemsFormArray.length + 1,
        cantidad: this.agregarItemForm.get('cantidad')?.value,
        descripcion: this.agregarItemForm.get('descripcion')?.value,
        precioUnitario: this.agregarItemForm.get('precioUnitario')?.value,
        total: this.calcularTotalItem()
      };

      // Agregar el item al FormArray local
      this.agregarItem(nuevoItem);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Item agregado correctamente'
      });

      this.cerrarDialogoAgregarItem();
      this.recalcularTotales();
    }
  }

  /**
   * Eliminar item - Solo maneja el estado local, no hace llamadas a la API
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
        // Eliminar del FormArray
        this.itemsFormArray.removeAt(index);

        // Actualizar números de items
        this.actualizarNumerosItems();

        // Recalcular totales
        this.recalcularTotales();

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Item eliminado correctamente'
        });
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

  // Método recalcularTotalesCotizacion eliminado - ahora usamos recalcularTotales()

  // Método recargarCotizacion eliminado - ya no es necesario

  // ===== MÉTODOS PARA TABS =====

  /**
   * Cambiar tab activa
   */
  onTabChange(event: any): void {
    this.activeTab = event.value || event;
    this.cdr.detectChanges();
  }

  /**
   * Cargar contenido de tab específica
   */
  loadTab(tabValue: string): void {
    this.activeTab = tabValue;
    this.cdr.detectChanges();
  }

  /**
   * Verificar si hay datos para mostrar
   */
  get hasData(): boolean {
    return this.cotizacion !== null;
  }

  /**
   * Buscar clientes con autoComplete
   */
  buscarClientes(event: any): void {
    const query = event.query || '';

    // Evitar múltiples llamadas con la misma query
    if (query.length >= 1) {
      this.clientesSugeridos = this.clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      // Mostrar todos los clientes cuando no hay query o está vacío
      this.clientesSugeridos = this.clientes.slice(0, 50); // Limitar a 50 para mejor rendimiento
    }
  }

  /**
   * Cuando se selecciona un cliente del dropdown
   */
  onClienteSeleccionado(event: any): void {
    const cliente: Cliente = event?.value || event;
    console.log('✅ Cliente seleccionado:', cliente);
    if (cliente && cliente.nombre) {
      this.clienteSeleccionado = cliente;
      console.log('📝 Cliente establecido:', this.clienteSeleccionado.nombre);
      // No necesitamos hacer patchValue porque el AutoComplete ya actualiza el FormControl
      // Solo marcamos como tocado para validación
      this.cotizacionForm.get('cliente')?.markAsTouched();
      // Forzar detección de cambios para mostrar los datos del cliente
      this.cdr.detectChanges();
    }
  }

  /**
   * Cuando se limpia la selección del cliente
   */
  onClienteClear(): void {
    this.clienteSeleccionado = null;
    // El AutoComplete ya limpia el FormControl, solo marcamos como tocado
    this.cotizacionForm.get('cliente')?.markAsTouched();
    this.cdr.detectChanges();
  }

  /**
   * Obtener cliente por nombre (para compatibilidad con carga de datos)
   */
  private findClienteByName(nombre: string): Cliente | null {
    return this.clientes.find(cliente => cliente.nombre === nombre) || null;
  }

  /**
   * Sincronizar selección de cliente cuando cambia el valor del formulario
   */
  private syncClienteSelection(): void {
    const clienteNombre = this.cotizacionForm.get('cliente')?.value;
    if (clienteNombre && typeof clienteNombre === 'string') {
      const cliente = this.findClienteByName(clienteNombre);
      if (cliente && cliente !== this.clienteSeleccionado) {
        this.clienteSeleccionado = cliente;
        this.cdr.detectChanges();
      }
    } else if (!clienteNombre) {
      this.clienteSeleccionado = null;
      this.cdr.detectChanges();
    }
  }

  /**
   * Editar cotización actual
   */
  editarCotizacion(): void {
    if (this.cotizacionId) {
      this.router.navigate(['/cotizar/mantenimiento-consulta/creacion'], {
        queryParams: { id: this.cotizacionId, modo: 'editar' }
      });
    }
  }

  /**
   * Eliminar cotización actual
   */
  eliminarCotizacion(): void {
    if (!this.cotizacionId || !this.cotizacion) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la cotización ${this.cotizacion.numero}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.cotizacionService.deleteCotizacion(this.cotizacionId!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Cotización eliminada correctamente'
              });
              this.router.navigate(['/cotizar/mantenimiento-consulta']);
            },
            error: (error) => {
              console.error('Error al eliminar cotización:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar la cotización'
              });
            }
          });
      }
    });
  }

  /**
   * Generar reporte PDF
   */
  generarReporte(): void {
    if (!this.cotizacionId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se puede generar el reporte: ID de cotización no válido'
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Generando reporte',
      detail: 'Por favor espere...'
    });

    this.reporteService.generarReporteCotizacion(this.cotizacionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cotizacion-${this.cotizacion?.numero || this.cotizacionId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Reporte generado y descargado correctamente'
          });
        },
        error: (error) => {
          console.error('Error al generar reporte:', error);
          let errorMessage = 'Error desconocido al generar el reporte';

          if (error.status === 404) {
            errorMessage = 'El servicio de reportes no está disponible. Contacte al administrador.';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor al generar el reporte';
          } else if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error al generar reporte',
            detail: errorMessage
          });
        }
      });
  }

}
