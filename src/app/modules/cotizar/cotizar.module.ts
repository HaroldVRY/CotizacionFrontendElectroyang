import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CotizarRoutingModule } from './cotizar-routing.module';
import { ClientesComponent } from './clientes/clientes.component';
import { MantConsComponent } from './mant-cons/mant-cons.component';
import { ServiciosComponent } from './servicios/servicios.component';
import { CreacionComponent } from './mant-cons/creacion/creacion.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng/prime-ng.module';
import { DialogItemComponent } from './mant-cons/dialog-item/dialog-item.component';
import { SharedModule } from '../../shared/shared.module';
import { DetalleClientesComponent } from './clientes/detalle-clientes/detalle-clientes.component';
import { DetalleServiciosComponent } from './servicios/detalle-servicios/detalle-servicios.component';
import { ProduccionComponent } from './produccion/produccion.component';

@NgModule({
  declarations: [
    ClientesComponent,
    MantConsComponent,
    CreacionComponent,
    ServiciosComponent,
    DialogItemComponent,
    DetalleClientesComponent,
    DetalleServiciosComponent,
    ProduccionComponent
  ],
  imports: [
    CommonModule,
    PrimeNgModule,
    CotizarRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ],
  providers: [
    // Los servicios MessageService y ConfirmationService ahora están disponibles globalmente desde AppModule
  ]
})
export class CotizarModule { }
