import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  items: MenuItem[] = [
    {
      label: 'Cotizaciones',
      routerLink: '/mantenimiento-consulta/lista-inicio',
      icon: 'pi pi-home',
      iconRef: 'iconInicio'
    },
    {
      label: 'Clientes',
      routerLink: '/clientes/lista-clientes',
      icon: 'pi pi-home',
      iconRef: 'iconInicio'
    },
    {
      label: 'Servicios',
      routerLink: '/servicios/lista-servicios',
      icon: 'pi pi-home',
      iconRef: 'iconInicio'
    },
    // {
    //   label: 'Mantenimiento y Consulta',
    //   icon: 'pi pi-search',
    //   iconRef: 'iconConsulta',
    //   items: [
    //     {
    //       label: 'Lista de Cotizaciones',
    //       routerLink: '/mantenimiento-consulta/lista-inicio',
    //       icon: 'pi pi-list',
    //       iconRef: 'iconLista'
    //     }
    //   ]
    // },
    // {
    //   label: 'Clientes',
    //   icon: 'pi pi-plus-circle',
    //   iconRef: 'iconCreacion',
    //   items: [
    //     {
    //       label: 'Lista de Clientes',
    //       routerLink: '/mantenimiento-consulta/detalle-creacion1',
    //       icon: 'pi pi-file-plus',
    //       iconRef: 'iconNueva'
    //     }
    //   ]
    // }
  ]

  getMenuItems(): MenuItem[] {
    return this.items;
  }
}
