import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';

import { MantenimientoConsultaRoutingModule } from './mantenimiento-consulta-routing.module';
import { ListaInicioComponent } from './lista-inicio/lista-inicio.component';
import { DetalleCreacion1Component } from './lista-inicio/detalle-creacion1/detalle-creacion1.component';

@NgModule({
  declarations: [
    ListaInicioComponent,
    DetalleCreacion1Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MantenimientoConsultaRoutingModule,
    // PrimeNG Modules
    TableModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    MenuModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    DividerModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class MantenimientoConsultaModule { }
