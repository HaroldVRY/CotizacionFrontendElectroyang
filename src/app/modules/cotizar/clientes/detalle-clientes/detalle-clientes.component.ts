import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ClienteService } from '../../../../service/cliente.service';
import { Cliente } from '../../interface/cotizacion.interface';

@Component({
  selector: 'app-detalle-clientes',
  standalone: false,
  templateUrl: './detalle-clientes.component.html',
  styleUrl: './detalle-clientes.component.css'
})
export class DetalleClientesComponent implements OnInit, OnDestroy {
  clienteForm!: FormGroup;
  cliente: Cliente | null = null;
  clienteId: number | null = null;
  modo: 'crear' | 'editar' | 'ver' = 'ver';
  isReadOnly: boolean = true;
  loading: boolean = false;
  saving: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
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
        this.clienteId = null;
        this.cliente = null;
        this.resetForm();
      } else if (id) {
        this.clienteId = parseInt(id, 10);
        this.modo = 'ver';
        this.isReadOnly = true;
        this.cargarCliente();
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
        return 'Cliente:';
      default:
        return 'Cliente';
    }
  }

  /**
   * Inicializar formulario
   */
  private initializeForm(): void {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
      contacto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]]
    });
  }

  /**
   * Cargar cliente por ID
   */
  private cargarCliente(): void {
    if (!this.clienteId) return;

    this.loading = true;

    this.clienteService.getClienteById(this.clienteId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.cliente = response.data;
            this.cargarDatosEnFormulario();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cargar el cliente'
            });
            this.cancelar();
          }
        },
        error: (error: any) => {
          console.error('Error al cargar cliente:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el cliente'
          });
          this.cancelar();
        }
      });
  }

  /**
   * Cargar datos del cliente en el formulario
   */
  private cargarDatosEnFormulario(): void {
    if (this.cliente) {
      this.clienteForm.patchValue({
        nombre: this.cliente.nombre,
        ruc: this.cliente.ruc,
        email: this.cliente.email,
        telefono: this.cliente.telefono,
        contacto: this.cliente.contacto,
        direccion: this.cliente.direccion
      });
    }
  }

  /**
   * Resetear formulario
   */
  private resetForm(): void {
    this.clienteForm.reset();
    // Establecer valores por defecto para evitar campos null
    this.clienteForm.patchValue({
      nombre: '',
      ruc: '',
      email: '',
      telefono: '',
      contacto: '',
      direccion: ''
    });
    this.cliente = null;
  }

  /**
   * Cambiar a modo edición
   */
  editarCliente(): void {
    this.modo = 'editar';
    this.isReadOnly = false;
  }

  /**
   * Guardar cliente (crear o actualizar)
   */
  guardarCliente(): void {
    if (this.clienteForm.invalid) {
      this.markFormGroupTouched();

      // Mostrar errores específicos para ayudar al usuario
      const errores: string[] = [];
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
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
    const formValue = this.clienteForm.value;

    // Limpiar datos: convertir valores null/undefined a cadenas vacías
    const datosCliente = {
      nombre: formValue.nombre || '',
      ruc: formValue.ruc || '',
      email: formValue.email || '',
      telefono: formValue.telefono || '',
      contacto: formValue.contacto || '',
      direccion: formValue.direccion || ''
    };

    // Debug: Mostrar los datos que se van a enviar
    console.log('🔄 INICIANDO PROCESO DE GUARDADO');
    console.log('Modo:', this.modo);
    console.log('Datos del formulario (raw):', formValue);
    console.log('Datos procesados:', datosCliente);
    console.log('Cliente ID:', this.clienteId);
    console.log('Saving state:', this.saving);

    const operacion = this.modo === 'crear'
      ? this.clienteService.createCliente(datosCliente)
      : this.clienteService.updateCliente(this.clienteId!, datosCliente);

    console.log('🌐 EJECUTANDO OPERACIÓN:', this.modo === 'crear' ? 'CREATE' : 'UPDATE');

    console.log('📡 CONFIGURANDO OBSERVABLE...');

    operacion
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🏁 FINALIZANDO OPERACIÓN - Setting saving = false');
          this.saving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('✅ RESPUESTA RECIBIDA:', response);
          if (response.success) {
            const mensaje = this.modo === 'crear' ? 'Cliente creado exitosamente' : 'Cliente actualizado exitosamente';
            console.log('🎉 OPERACIÓN EXITOSA:', mensaje);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: mensaje
            });

            if (this.modo === 'crear') {
              // Redirigir al detalle del cliente recién creado
              console.log('🔄 REDIRIGIENDO A:', `/cotizar/clientes/${response.data.id}`);
              this.router.navigate(['/cotizar/clientes', response.data.id]);
            } else {
              // Actualizar datos y cambiar a modo ver
              this.cliente = response.data;
              this.cargarDatosEnFormulario();
              this.modo = 'ver';
              this.isReadOnly = true;
            }
          } else {
            console.log('❌ RESPUESTA SIN SUCCESS:', response);
          }
        },
        error: (error: any) => {
          console.error('❌ ERROR EN SUBSCRIBE:', error);
          console.error('Error details:', error.error);
          console.error('Status:', error.status);

          let errorMessage = 'Error al guardar el cliente';
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

    console.log('🎯 OBSERVABLE CONFIGURADO Y EJECUTÁNDOSE...');
  }

  /**
   * Eliminar cliente
   */
  eliminarCliente(): void {
    if (!this.clienteId) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el cliente "${this.cliente?.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.loading = true;

        this.clienteService.deleteCliente(this.clienteId!)
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
                  detail: 'Cliente eliminado exitosamente'
                });
                this.router.navigate(['/cotizar/clientes']);
              }
            },
            error: (error: any) => {
              console.error('Error al eliminar cliente:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el cliente'
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
      this.router.navigate(['/cotizar/clientes']);
    } else if (this.modo === 'editar') {
      // Volver a modo ver y recargar datos originales
      this.modo = 'ver';
      this.isReadOnly = true;
      this.cargarDatosEnFormulario();
    } else {
      this.router.navigate(['/cotizar/clientes']);
    }
  }

  /**
   * Marcar todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.clienteForm.controls).forEach(key => {
      const control = this.clienteForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.clienteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.clienteForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        return 'Formato inválido';
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
      ruc: 'RUC',
      email: 'Email',
      telefono: 'Teléfono',
      contacto: 'Contacto',
      direccion: 'Dirección'
    };
    return labels[fieldName] || fieldName;
  }
}
