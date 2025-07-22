import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CreacionCotizacionRoutingModule } from './creacion-cotizacion-routing.module';
import { DetalleCreacion1Component } from './detalle-creacion1/detalle-creacion1.component';


@NgModule({
  declarations: [
    DetalleCreacion1Component
  ],
  imports: [
    CommonModule,
    CreacionCotizacionRoutingModule
  ]
})
export class CreacionCotizacionModule { }
