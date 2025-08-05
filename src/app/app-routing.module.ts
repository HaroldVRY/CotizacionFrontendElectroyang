import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/mantenimiento-consulta/lista-inicio', pathMatch: 'full' },
  {
    path: 'mantenimiento-consulta',
    loadChildren: () => import('./modules/mantenimiento-consulta/mantenimiento-consulta.module').then(m => m.MantenimientoConsultaModule),
  },
  {
    path: 'creacion-cotizacion',
    loadChildren: () => import('./modules/creacion-cotizacion/creacion-cotizacion.module').then(m => m.CreacionCotizacionModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
