import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetalleCreacion1Component } from './detalle-creacion1/detalle-creacion1.component';

const routes: Routes = [
      { path: '', redirectTo: 'detalle-creacion1', pathMatch: 'full' },
      { path: 'detalle-creacion1', component: DetalleCreacion1Component},
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreacionCotizacionRoutingModule { }
