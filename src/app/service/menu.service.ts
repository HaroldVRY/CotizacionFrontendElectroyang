import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  items: MenuItem[] = [
    {
      label: 'Inicio',
      routerLink: '/lista-inicio',
      icon: 'pi pi-home',
      iconRef: 'iconInicio'
    },
    {
      label: 'Mantenimiento y Consulta',
      icon: 'pi pi-search',
      iconRef: 'iconConsulta',
      items: [
        {
          label: 'Lista de Cotizaciones',
          routerLink: '/lista-inicio',
          icon: 'pi pi-list',
          iconRef: 'iconLista'
        }
      ]
    },
    {
      label: 'Creación de Cotización',
      icon: 'pi pi-plus-circle',
      iconRef: 'iconCreacion',
      items: [
        {
          label: 'Nueva Cotización',
          routerLink: '/crear-cotizacion',
          icon: 'pi pi-file-plus',
          iconRef: 'iconNueva'
        },
        {
          label: 'Detalle de Creación',
          routerLink: '/crear-cotizacion/detalle-creacion1',
          icon: 'pi pi-pencil',
          iconRef: 'iconDetalle'
        }
      ]
    }
  ]

  getMenuItems(): MenuItem[] {
    return this.items;
  }
}
