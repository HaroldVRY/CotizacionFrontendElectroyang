import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'CotizacionFrontendElectroyang';
    // Variable para controlar la visibilidad del sidebar
  isSidebarVisible: boolean = false;

  // Detectar cambios en el tamaño de la ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const width = window.innerWidth;
    this.checkScreenSize(width);
  }

  ngOnInit() {
    this.checkScreenSize(window.innerWidth); // Inicializa el valor cuando se carga la aplicación
  }

  // Función para controlar la visibilidad del sidebar y toolbar
  checkScreenSize(width: number) {
    if (width <= 1000) {
      this.isSidebarVisible = true;  // Mostrar el sidebar en pantallas pequeñas
    } else {
      this.isSidebarVisible = false; // Mostrar el toolbar en pantallas grandes
    }
  }
}
