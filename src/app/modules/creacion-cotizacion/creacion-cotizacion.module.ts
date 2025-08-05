import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { CreacionCotizacionRoutingModule } from './creacion-cotizacion-routing.module';
import { DetalleCreacion1Component } from './detalle-creacion1/detalle-creacion1.component';

@NgModule({
  declarations: [
    DetalleCreacion1Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CreacionCotizacionRoutingModule,
    // PrimeNG Modules
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    CheckboxModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    TooltipModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class CreacionCotizacionModule { }
