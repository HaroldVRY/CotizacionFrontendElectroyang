import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-item',
  standalone: false,
  templateUrl: './sidebar-item.component.html',
  styleUrl: './sidebar-item.component.css'
})
export class SidebarItemComponent {

  @Input() item!: MenuItem; // Recibe el ítem como entrada
  @Input() depth: number = 0; // Para controlar la profundidad (nivel de anidación)

  constructor(private router: Router) {}

  // Alterna la expansión del menú
  toggleExpansion() {
    if (this.item.items && this.item.items.length > 0) {
      this.item.expanded = !this.item.expanded;
    } else if (this.item.routerLink) {
      // Si no tiene subitems, navega directamente
      this.router.navigate([this.item.routerLink]);
    }
  }

  // Navega a la ruta específica
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
