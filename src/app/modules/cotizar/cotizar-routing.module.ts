import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MantConsComponent } from './mant-cons/mant-cons.component';
import { ClientesComponent } from './clientes/clientes.component';
import { ServiciosComponent } from './servicios/servicios.component';
import { CreacionComponent } from './mant-cons/creacion/creacion.component';
import { DetalleClientesComponent } from './clientes/detalle-clientes/detalle-clientes.component';
import { DetalleServiciosComponent } from './servicios/detalle-servicios/detalle-servicios.component';
import { ProduccionComponent } from './produccion/produccion.component';

const routes: Routes = [
  { path: 'mantenimiento-consulta', component: MantConsComponent },
  { path: 'mantenimiento-consulta/creacion', component: CreacionComponent },
  { path: 'clientes', component: ClientesComponent },
  { path: 'clientes/:id', component: DetalleClientesComponent },
  { path: 'servicios', component: ServiciosComponent },
  { path: 'servicios/:id', component: DetalleServiciosComponent },
  { path: 'produccion', component: ProduccionComponent },
  { path: '', redirectTo: 'mantenimiento-consulta', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CotizarRoutingModule { }
