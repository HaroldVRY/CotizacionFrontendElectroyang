import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaInicioComponent } from './lista-inicio/lista-inicio.component';
import { DetalleCreacion1Component } from './lista-inicio/detalle-creacion1/detalle-creacion1.component';

const routes: Routes = [
    { path: '', redirectTo: 'lista-inicio', pathMatch: 'full' },
    { path: 'lista-inicio', component: ListaInicioComponent },
    { path: 'detalle-creacion1', component: DetalleCreacion1Component },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MantenimientoConsultaRoutingModule { }
