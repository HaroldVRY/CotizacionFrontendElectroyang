import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleCreacion1Component } from './detalle-creacion1.component';

describe('DetalleCreacion1Component', () => {
  let component: DetalleCreacion1Component;
  let fixture: ComponentFixture<DetalleCreacion1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalleCreacion1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleCreacion1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
