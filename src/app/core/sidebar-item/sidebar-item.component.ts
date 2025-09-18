import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { MenuStateService } from '../../service/menu-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar-item',
  standalone: false,
  templateUrl: './sidebar-item.component.html',
  styleUrl: './sidebar-item.component.css'
})
export class SidebarItemComponent implements OnInit, OnDestroy {

  @Input() item!: MenuItem; // Recibe el ítem como entrada
  @Input() depth: number = 0; // Para controlar la profundidad (nivel de anidación)

  private subscription: Subscription = new Subscription();
  isExpanded: boolean = false;

  constructor(
    private router: Router,
    private menuStateService: MenuStateService
  ) {}

  ngOnInit() {
    // Suscribirse a los cambios de estado del menú
    this.subscription.add(
      this.menuStateService.currentExpandedItem$.subscribe(state => {
        const itemId = this.getItemId();
        this.isExpanded = this.menuStateService.isItemExpanded('sidebar', itemId);

        // Actualizar el estado en el objeto MenuItem para compatibilidad
        if (this.item) {
          this.item.expanded = this.isExpanded;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Genera un ID único para el item basado en su label y posición
  private getItemId(): string {
    return `${this.item.label?.replace(/\s+/g, '-').toLowerCase()}-${this.depth}`;
  }

  // Alterna la expansión del menú
  toggleExpansion() {
    console.log('=== SIDEBAR CLICK DEBUG ===');
    console.log('Item:', this.item.label);
    console.log('routerLink:', this.item.routerLink);
    console.log('items:', this.item.items);
    console.log('expanded:', this.item.expanded);
    console.log('isExpanded:', this.isExpanded);
    console.log('===========================');

    if (this.item.items && this.item.items.length > 0) {
      const itemId = this.getItemId();
      const newState = this.menuStateService.toggleExpansion('sidebar', itemId);
      console.log('New expanded state:', newState);
    } else if (this.item.routerLink) {
      // Si no tiene subitems, navega directamente
      console.log('Navigating to:', this.item.routerLink);
      this.router.navigate([this.item.routerLink]);
      // Cerrar todos los menús al navegar
      this.menuStateService.closeAllMenus();
    }
  }

  // Navega a la ruta específica
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.menuStateService.closeAllMenus();
  }
}
