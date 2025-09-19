import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MenuService } from '../../service/menu.service';
import { MenuStateService } from '../../service/menu-state.service';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import * as global from '../../global';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  titulo = global.titulo;

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
    this.setupMenuItems();
    // Suscribirse a los cambios de estado del menú
    this.subscription.add(
      this.menuStateService.currentExpandedItem$.subscribe(state => {
        this.updateMenuStates(state);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private setupMenuItems() {
    this.menuItems.forEach((item, index) => {
      if (item.items && item.items.length > 0) {
        // Agregar command para manejar la expansión
        item.command = (event) => {
          this.handleMenuExpansion(item, index);
        };

        // Configurar subitems
        item.items.forEach(subItem => {
          if (subItem.routerLink) {
            subItem.command = () => {
              this.menuStateService.closeAllMenus();
            };
          }
        });
      } else if (item.routerLink) {
        // Para items sin hijos que navegan directamente
        item.command = () => {
          this.menuStateService.closeAllMenus();
        };
      }
    });
  }

  private handleMenuExpansion(item: MenuItem, index: number) {
    const itemId = `sidebar-${item.label?.replace(/\s+/g, '-').toLowerCase()}-${index}`;
    const isExpanded = this.menuStateService.toggleExpansion('sidebar', itemId);

    // Actualizar el estado del item
    item.expanded = isExpanded;

    // Cerrar otros paneles abiertos
    this.menuItems.forEach((otherItem, otherIndex) => {
      if (otherIndex !== index && otherItem.expanded) {
        otherItem.expanded = false;
      }
    });
  }

  private updateMenuStates(state: any) {
    if (!state || state.componentType !== 'sidebar') {
      // Si no hay estado o no es para sidebar, cerrar todos
      this.menuItems.forEach(item => {
        if (item.expanded) {
          item.expanded = false;
        }
      });
    }
  }
}
