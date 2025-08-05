import { Component } from '@angular/core';
import * as global from '../../global'
@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  anio: number = global.anio;

}
