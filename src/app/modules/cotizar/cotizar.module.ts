import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CotizarRoutingModule } from './cotizar-routing.module';
import { ClientesComponent } from './clientes/clientes.component';
import { MantConsComponent } from './mant-cons/mant-cons.component';
import { ServiciosComponent } from './servicios/servicios.component';
import { CreacionComponent } from './mant-cons/creacion/creacion.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng/prime-ng.module';


@NgModule({
  declarations: [
    ClientesComponent,
    MantConsComponent,
    CreacionComponent,
    ServiciosComponent
  ],
  imports: [
    CommonModule,
    PrimeNgModule,
    CotizarRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class CotizarModule { }
