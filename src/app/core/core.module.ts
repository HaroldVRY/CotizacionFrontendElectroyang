import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SidebarComponent } from './sidebar/sidebar.component';
import { AppRoutingModule } from '../app-routing.module';
import { PrimeNgModule } from '../prime-ng/prime-ng.module';
import { ToolbarModule } from 'primeng/toolbar';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SidebarItemComponent } from './sidebar-item/sidebar-item.component';
import { ToolbarItemComponent } from './toolbar-item/toolbar-item.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';

@NgModule({
  declarations: [
    SidebarComponent,
    ToolbarComponent,
    SidebarItemComponent,
    ToolbarItemComponent,
    FooterComponent,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AppRoutingModule,
    PrimeNgModule,
    ToolbarModule
  ],
    exports: [SidebarComponent, ToolbarComponent, FooterComponent, HeaderComponent]
})
export class CoreModule { }
