import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaInicioComponent } from './lista-inicio/lista-inicio.component';

const routes: Routes = [
    { path: '', redirectTo: 'lista-inicio', pathMatch: 'full' },
    { path: 'lista-inicio', component: ListaInicioComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MantenimientoConsultaRoutingModule { }
