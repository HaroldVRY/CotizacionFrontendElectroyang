import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MenuService } from '../../../app/service/menu.service';
import { MenuStateService } from '../../service/menu-state.service';
import { Subscription } from 'rxjs';
import * as global from '../../global';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-toolbar',
  standalone: false,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent implements OnInit, OnDestroy {
  titulo = global.titulo;
  @Input() isSidebarVisible: boolean = false;

  @Input()
  open: boolean = true;

  menuItems: MenuItem[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private menuService: MenuService,
    private menuStateService: MenuStateService
  ) { }

  ngOnInit() {
    this.menuItems = this.menuService.getMenuItems();
    this.initializeMenuItems();
    console.log('Menu items initialized for toolbar:', this.menuItems);

    // Suscribirse a los cambios de estado del menú
    this.subscription.add(
      this.menuStateService.currentExpandedItem$.subscribe(state => {
        // Si se expande algo en el sidebar, cerrar elementos del toolbar
        if (state && state.componentType === 'sidebar') {
          this.closeAllToolbarMenus();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private initializeMenuItems() {
    this.menuItems.forEach(item => {
      if (item.items) {
        item.expanded = false;
      }
    });
  }

  private closeAllToolbarMenus() {
    this.menuItems.forEach(item => {
      if (item.expanded) {
        item.expanded = false;
      }
    });
  }
}
