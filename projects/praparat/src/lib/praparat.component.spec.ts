import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PraparatComponent } from './praparat.component';

describe('PraparatComponent', () => {
  let component: PraparatComponent;
  let fixture: ComponentFixture<PraparatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PraparatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PraparatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
