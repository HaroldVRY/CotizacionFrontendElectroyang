import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/mantenimiento-consulta/lista-inicio', pathMatch: 'full' },
  {
    path: 'mantenimiento-consulta',
    loadChildren: () => import('./modules/mantenimiento-consulta/mantenimiento-consulta.module').then(m => m.MantenimientoConsultaModule),
  },
  { path: 'clientes',
    loadChildren: () => import('./modules/clientes/clientes.module').then(m => m.ClientesModule)
  },
  { path: 'servicios',
    loadChildren: () => import('./modules/servicios/servicios.module').then(m => m.ServiciosModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
