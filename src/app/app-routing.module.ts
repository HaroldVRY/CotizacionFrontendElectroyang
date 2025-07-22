import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo:'lista-inicio', pathMatch: 'full'},
  {
  path: 'lista-inicio',
  loadChildren: () => import('./modules/mantenimiento-consulta/mantenimiento-consulta.module').then(m => m.MantenimientoConsultaModule),
  },
  {
  path: 'crear-cotizacion',
  loadChildren: () => import('./modules/creacion-cotizacion/creacion-cotizacion.module').then(m => m.CreacionCotizacionModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
