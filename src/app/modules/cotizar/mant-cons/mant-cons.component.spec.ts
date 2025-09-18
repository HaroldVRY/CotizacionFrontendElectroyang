import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantConsComponent } from './mant-cons.component';

describe('MantConsComponent', () => {
  let component: MantConsComponent;
  let fixture: ComponentFixture<MantConsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MantConsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantConsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
