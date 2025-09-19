import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogoComponent } from './components/dialogo/dialogo.component';
import { PrimeNgModule } from '../prime-ng/prime-ng.module';
import { RouterModule } from '@angular/router';
import { CustomDialogService } from './services/dialog.service';

@NgModule({
  declarations: [
    DialogoComponent
  ],
  imports: [
    CommonModule,
    PrimeNgModule,
    RouterModule
  ],
  exports: [
    DialogoComponent
  ],
  providers: [
    CustomDialogService
  ]
})
export class SharedModule { }
