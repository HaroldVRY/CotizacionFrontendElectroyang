import { Component, Input, OnInit } from '@angular/core';
import { MenuElemento } from '../../interface/core.interface';
import { MenuService } from '../../service/menu.service';

@Component({
  selector: 'app-toolbar',
  standalone: false,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent implements OnInit {
  @Input() isSidebarVisible: boolean = false;

  menuItems: MenuElemento[] = [];

  constructor(private menuService: MenuService) { }

  ngOnInit(): void {
    this.menuItems = this.menuService.getMenuItems();
  }
}
