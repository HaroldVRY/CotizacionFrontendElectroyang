import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

export interface MenuExpansionState {
  componentType: 'sidebar' | 'toolbar';
  itemId: string;
  isExpanded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuStateService {
  private currentExpandedItem = new BehaviorSubject<MenuExpansionState | null>(null);
  public currentExpandedItem$ = this.currentExpandedItem.asObservable();

  constructor() {
    // Listener global para cerrar menús al hacer clic fuera
    this.setupGlobalClickListener();
  }

  private setupGlobalClickListener() {
    fromEvent(document, 'click').subscribe((event: Event) => {
      const target = event.target as HTMLElement;

      // Si el clic no es en un elemento del menú, cerrar todos los menús
      if (!this.isMenuElement(target)) {
        this.closeAllMenus();
      }
    });
  }

  private isMenuElement(element: HTMLElement): boolean {
    // Verificar si el elemento clickeado es parte de un menú
    return element.closest('.menu-link, .submenu, .sidebar-menu, .horizontal-menu') !== null;
  }

  // Controla la expansión de un elemento del menú
  toggleExpansion(componentType: 'sidebar' | 'toolbar', itemId: string, forceExpand?: boolean): boolean {
    const currentState = this.currentExpandedItem.value;

    // Si hay un elemento expandido y es diferente al actual, lo cerramos
    if (currentState &&
        (currentState.componentType !== componentType || currentState.itemId !== itemId)) {
      // Cerrar el elemento anterior
      this.currentExpandedItem.next(null);
    }

    // Determinar el nuevo estado
    const shouldExpand = forceExpand !== undefined ? forceExpand :
                        (!currentState ||
                         currentState.componentType !== componentType ||
                         currentState.itemId !== itemId);

    if (shouldExpand) {
      this.currentExpandedItem.next({
        componentType,
        itemId,
        isExpanded: true
      });
      return true;
    } else {
      this.currentExpandedItem.next(null);
      return false;
    }
  }

  // Verifica si un elemento específico está expandido
  isItemExpanded(componentType: 'sidebar' | 'toolbar', itemId: string): boolean {
    const currentState = this.currentExpandedItem.value;
    return currentState?.componentType === componentType &&
           currentState?.itemId === itemId &&
           currentState?.isExpanded === true;
  }

  // Cierra todos los menús
  closeAllMenus(): void {
    this.currentExpandedItem.next(null);
  }

  // Obtiene el estado actual
  getCurrentState(): MenuExpansionState | null {
    return this.currentExpandedItem.value;
  }
}
