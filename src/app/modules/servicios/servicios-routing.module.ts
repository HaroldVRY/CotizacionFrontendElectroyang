import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaServComponent } from './lista-serv/lista-serv.component';

const routes: Routes = [
        { path: '', redirectTo: 'lista-servicios', pathMatch: 'full' },
        { path: 'lista-servicios', component: ListaServComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServiciosRoutingModule { }
