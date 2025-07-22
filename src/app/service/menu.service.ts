import { Injectable } from '@angular/core';
import { MenuElemento } from '../interface/core.interface';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

    items: MenuElemento[] = [
    {
      nombre: 'Crear Cotización',
      ruta: '/detalle-creacion1',
      iconRef: 'iconDetalleCreacion1'
    },
    {
      nombre: 'Lista de Cotizaciones',
      ruta: '/lista-inicio',
      iconRef: 'iconListaInicio'
    }
  ]

    getMenuItems(): MenuElemento[] {
    return this.items;
  }
}
