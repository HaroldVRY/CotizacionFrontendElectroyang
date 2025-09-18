import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  items: MenuItem[] = [
    {
      label: 'Cotizaciones',
      routerLink: '/cotizar/mantenimiento-consulta',
      icon: 'pi pi-list',
      iconRef: 'iconInicio'
    },
    {
      label: 'Clientes',
      routerLink: '/cotizar/clientes',
      icon: 'pi pi-users',
      iconRef: 'iconInicio'
    },
    {
      label: 'Servicios',
      routerLink: '/cotizar/servicios',
      icon: 'pi pi-cog',
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
