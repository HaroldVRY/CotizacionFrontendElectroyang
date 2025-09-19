import { Component, OnDestroy, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialogo',
  standalone: false,
  templateUrl: './dialogo.component.html',
  styleUrl: './dialogo.component.css'
})
export class DialogoComponent implements OnInit, OnDestroy {

  mensaje: string = '';
  severidad: string = 'info'; // default severity
  icono: string = 'pi-info-circle'; // default icon

  // Nuevas propiedades para soportar confirmación
  mostrarBotones: boolean = false;
  labelAceptar: string = 'Aceptar';
  labelCerrar: string = 'Cerrar';

  private audioError = new Audio(); // Crear una instancia de Audio

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig) {
    this.audioError.src = 'audio/error.mp3'; // Ruta al archivo MP3
    this.audioError.load(); // Cargar el audio
  }

  ngOnInit(): void {

    if (this.config.data) {
      this.mensaje = this.config.data.mensaje || 'Mensaje por defecto';
      this.severidad = this.config.data.severidad || 'info';

      // Nuevas configuraciones para confirmación
      this.mostrarBotones = this.config.data.mostrarBotones || false;
      this.labelAceptar = this.config.data.labelAceptar || 'Aceptar';
      this.labelCerrar = this.config.data.labelCerrar || 'Cerrar';

      switch(this.severidad) {
        case 'error':
          this.icono = 'pi-times-circle';
          break;
        case 'warn':
          this.icono = 'pi-exclamation-triangle';
          break;
        case 'success':
          this.icono = 'pi-check-circle';
          break;
        default:
          this.icono = 'pi-info-circle';
          break;
      }
    }

    // Agregar listener para detectar Enter
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy(): void {
    // Remover el listener al destruir el componente
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.stopAudio();
      // console.log('Se presionó Enter mientras el diálogo estaba abierto.');
      this.playAudio()
      event.preventDefault(); // Evitar cualquier acción predeterminada
    }
  };

  cerrar() {
    this.ref.close(this.mostrarBotones ? 'cerrar' : true);
  }

  // Nuevo método para aceptar
  aceptar() {
    this.ref.close('aceptar');
  }

  playAudio() {
    this.audioError.play().catch((error) => {
      console.error('Error al reproducir el audio:', error);
    });
  }

  pauseAudio() {
    this.audioError.pause(); // Pausar el audio
  }

  stopAudio() {
    this.audioError.pause(); // Pausar el audio
    this.audioError.currentTime = 0; // Reiniciar el audio
  }

}
