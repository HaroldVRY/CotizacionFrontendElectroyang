import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogItemComponent } from './dialog-item.component';

describe('DialogItemComponent', () => {
  let component: DialogItemComponent;
  let fixture: ComponentFixture<DialogItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
