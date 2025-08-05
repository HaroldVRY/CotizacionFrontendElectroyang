export interface MenuElemento {
  nombre: string;
  ruta?: string; // La ruta es opcional para los elementos que solo tienen submenú
  iconRef: string;
  hijos?: MenuElemento[]; // Submenú, de forma recursiva
}
