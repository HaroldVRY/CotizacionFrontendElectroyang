import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ServiciosRoutingModule } from './servicios-routing.module';
import { ListaServComponent } from './lista-serv/lista-serv.component';
import { PrimeNgModule } from '../../prime-ng/prime-ng.module';

@NgModule({
  declarations: [
    ListaServComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ServiciosRoutingModule,
    PrimeNgModule
  ]
})
export class ServiciosModule { }
