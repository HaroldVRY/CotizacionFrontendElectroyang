import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaClieComponent } from './lista-clie/lista-clie.component';

const routes: Routes = [
      { path: '', redirectTo: 'lista-clientes', pathMatch: 'full' },
      { path: 'lista-clientes', component: ListaClieComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientesRoutingModule { }
