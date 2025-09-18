import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'cotizar', pathMatch: 'full' },
  {
    path: 'cotizar',
    loadChildren: () => import('./modules/cotizar/cotizar.module').then(m => m.CotizarModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    onSameUrlNavigation: 'reload',
    enableTracing: false // Cambia a true para debugging si es necesario
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
