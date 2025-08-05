import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaClieComponent } from './lista-clie.component';

describe('ListaClieComponent', () => {
  let component: ListaClieComponent;
  let fixture: ComponentFixture<ListaClieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaClieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaClieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
