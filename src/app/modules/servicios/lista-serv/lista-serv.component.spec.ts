import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaServComponent } from './lista-serv.component';

describe('ListaServComponent', () => {
  let component: ListaServComponent;
  let fixture: ComponentFixture<ListaServComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaServComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaServComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
