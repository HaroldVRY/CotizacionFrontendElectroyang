import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MantenimientoConsultaRoutingModule } from './mantenimiento-consulta-routing.module';
import { ListaInicioComponent } from './lista-inicio/lista-inicio.component';


@NgModule({
  declarations: [
    ListaInicioComponent
  ],
  imports: [
    CommonModule,
    MantenimientoConsultaRoutingModule
  ]
})
export class MantenimientoConsultaModule { }
